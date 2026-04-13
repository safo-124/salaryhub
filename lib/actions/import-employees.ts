"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { Role } from "@/lib/generated/prisma/client";
import { initLeaveBalances } from "./leave-balances";

const REQUIRED_HEADERS = ["firstName", "lastName", "email", "basicSalary", "startDate"];
const OPTIONAL_HEADERS = [
    "phone", "department", "jobTitle", "role", "allowances",
    "bankName", "bankAccount", "ssnit", "tin",
];
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
const VALID_ROLES = ["EMPLOYEE", "SUPERVISOR", "HR_MANAGER", "PAYROLL_ADMIN", "OWNER"];

export async function getCSVTemplate() {
    return ALL_HEADERS.join(",") + "\nJohn,Doe,john@example.com,5000,2026-01-15,+233501234567,Engineering,Software Engineer,EMPLOYEE,500,GCB Bank,1234567890,C/0123456789,C0123456789";
}

export async function importEmployeesCSV(formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
        return { success: false, error: "No file provided" };
    }

    if (!file.name.endsWith(".csv")) {
        return { success: false, error: "Only CSV files are supported" };
    }

    // 2MB limit
    if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: "File too large (max 2MB)" };
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
        return { success: false, error: "CSV must have a header row and at least one data row" };
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim());
    for (const req of REQUIRED_HEADERS) {
        if (!headers.includes(req)) {
            return { success: false, error: `Missing required column: ${req}` };
        }
    }

    // Check tenant limit
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxEmployees: true, _count: { select: { employees: true } } },
    });
    const currentCount = tenant?._count.employees ?? 0;
    const maxEmployees = tenant?.maxEmployees ?? 25;
    const rowCount = lines.length - 1;
    if (currentCount + rowCount > maxEmployees) {
        return {
            success: false,
            error: `Import would exceed employee limit. Current: ${currentCount}, Importing: ${rowCount}, Limit: ${maxEmployees}.`,
        };
    }

    // Get next employee ID number
    const lastEmp = await prisma.employee.findFirst({
        where: { tenantId },
        orderBy: { employeeId: "desc" },
        select: { employeeId: true },
    });
    let nextNum = lastEmp
        ? parseInt(lastEmp.employeeId.replace("SH-", ""), 10) + 1
        : 1;

    // Look up departments for matching
    const departments = await prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));

    // Get existing emails to check for duplicates
    const existingEmails = new Set(
        (await prisma.employee.findMany({
            where: { tenantId },
            select: { email: true },
        })).map((e) => e.email.toLowerCase())
    );

    // Parse rows
    const errors: string[] = [];
    const employees: {
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        department: string | null;
        departmentId: string | null;
        jobTitle: string | null;
        role: Role;
        basicSalary: number;
        allowances: number;
        bankName: string | null;
        bankAccount: string | null;
        ssnit: string | null;
        tin: string | null;
        startDate: Date;
    }[] = [];

    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = (values[idx] ?? "").trim();
        });

        const rowNum = i + 1;
        const rowErrors: string[] = [];

        // Validate required fields
        if (!row.firstName) rowErrors.push("firstName is required");
        if (!row.lastName) rowErrors.push("lastName is required");
        if (!row.email) rowErrors.push("email is required");
        if (!row.basicSalary || isNaN(parseFloat(row.basicSalary)))
            rowErrors.push("basicSalary must be a number");
        if (!row.startDate || isNaN(Date.parse(row.startDate)))
            rowErrors.push("startDate must be a valid date (YYYY-MM-DD)");

        // Validate email format
        const email = row.email?.toLowerCase();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            rowErrors.push("invalid email format");
        }

        // Check for duplicate emails
        if (email && existingEmails.has(email)) {
            rowErrors.push(`email ${email} already exists`);
        }
        if (email && seenEmails.has(email)) {
            rowErrors.push(`duplicate email ${email} in CSV`);
        }

        // Validate role
        const role = (row.role || "EMPLOYEE").toUpperCase();
        if (!VALID_ROLES.includes(role)) {
            rowErrors.push(`invalid role: ${row.role}. Valid: ${VALID_ROLES.join(", ")}`);
        }

        if (rowErrors.length > 0) {
            errors.push(`Row ${rowNum}: ${rowErrors.join("; ")}`);
            continue;
        }

        const deptName = row.department || null;
        const departmentId = deptName ? deptMap.get(deptName.toLowerCase()) || null : null;

        const employeeId = `SH-${String(nextNum).padStart(4, "0")}`;
        nextNum++;
        seenEmails.add(email);

        employees.push({
            employeeId,
            firstName: row.firstName,
            lastName: row.lastName,
            email,
            phone: row.phone || null,
            department: deptName,
            departmentId,
            jobTitle: row.jobTitle || null,
            role: role as Role,
            basicSalary: parseFloat(row.basicSalary),
            allowances: parseFloat(row.allowances || "0") || 0,
            bankName: row.bankName || null,
            bankAccount: row.bankAccount || null,
            ssnit: row.ssnit || null,
            tin: row.tin || null,
            startDate: new Date(row.startDate),
        });
    }

    if (errors.length > 0) {
        return {
            success: false,
            error: `Validation failed:\n${errors.join("\n")}`,
            errorCount: errors.length,
        };
    }

    // Bulk insert
    let created = 0;
    const createdIds: string[] = [];
    for (const emp of employees) {
        try {
            const employee = await prisma.employee.create({
                data: { tenantId, ...emp },
            });
            await initLeaveBalances(employee.id);
            createdIds.push(employee.id);
            created++;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`Failed to create ${emp.firstName} ${emp.lastName}: ${msg}`);
        }
    }

    revalidatePath("/employees");
    revalidatePath("/departments");

    if (errors.length > 0) {
        return {
            success: true,
            created,
            errors,
            error: `Imported ${created} of ${employees.length}. ${errors.length} failed.`,
        };
    }

    return { success: true, created };
}

/** Parse a CSV line handling quoted values */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}
