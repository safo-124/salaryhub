"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { EmployeeStatus, Role } from "@/lib/generated/prisma/client";

// ─── Queries ─────────────────────────────────────────────

export async function getEmployees() {
    const { tenantId } = await requireTenantSession();
    const employees = await prisma.employee.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
    });
    return employees.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        department: e.department,
        jobTitle: e.jobTitle,
        role: e.role,
        basicSalary: Number(e.basicSalary),
        allowances: Number(e.allowances),
        bankName: e.bankName,
        bankAccount: e.bankAccount,
        ssnit: e.ssnit,
        tin: e.tin,
        startDate: e.startDate.toISOString().split("T")[0],
        status: e.status,
    }));
}

export async function getEmployee(id: string) {
    const { tenantId } = await requireTenantSession();
    const e = await prisma.employee.findFirst({
        where: { id, tenantId },
    });
    if (!e) return null;
    return {
        id: e.id,
        employeeId: e.employeeId,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        department: e.department,
        jobTitle: e.jobTitle,
        role: e.role,
        basicSalary: Number(e.basicSalary),
        allowances: Number(e.allowances),
        bankName: e.bankName,
        bankAccount: e.bankAccount,
        ssnit: e.ssnit,
        tin: e.tin,
        startDate: e.startDate.toISOString().split("T")[0],
        status: e.status,
    };
}

// ─── Mutations ───────────────────────────────────────────

export async function createEmployee(formData: FormData) {
    const { tenantId } = await requireTenantSession();

    // Generate next employee ID
    const lastEmp = await prisma.employee.findFirst({
        where: { tenantId },
        orderBy: { employeeId: "desc" },
        select: { employeeId: true },
    });
    const nextNum = lastEmp
        ? parseInt(lastEmp.employeeId.replace("SH-", ""), 10) + 1
        : 1;
    const employeeId = `SH-${String(nextNum).padStart(4, "0")}`;

    // Check tenant employee limit
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxEmployees: true, _count: { select: { employees: true } } },
    });
    if (tenant && tenant._count.employees >= tenant.maxEmployees) {
        return { success: false, error: `Employee limit reached (${tenant.maxEmployees}). Upgrade your plan.` };
    }

    try {
        const employee = await prisma.employee.create({
            data: {
                tenantId,
                employeeId,
                firstName: formData.get("firstName") as string,
                lastName: formData.get("lastName") as string,
                email: formData.get("email") as string,
                phone: (formData.get("phone") as string) || null,
                department: (formData.get("department") as string) || null,
                jobTitle: (formData.get("jobTitle") as string) || null,
                role: ((formData.get("role") as string) || "EMPLOYEE") as Role,
                basicSalary: parseFloat(formData.get("basicSalary") as string) || 0,
                allowances: parseFloat(formData.get("allowances") as string) || 0,
                bankName: (formData.get("bankName") as string) || null,
                bankAccount: (formData.get("bankAccount") as string) || null,
                ssnit: (formData.get("ssnit") as string) || null,
                tin: (formData.get("tin") as string) || null,
                startDate: new Date(formData.get("startDate") as string),
            },
        });
        revalidatePath("/employees");
        return { success: true, id: employee.id };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create employee";
        if (msg.includes("Unique constraint")) {
            return { success: false, error: "An employee with this email already exists." };
        }
        return { success: false, error: msg };
    }
}

export async function updateEmployee(id: string, formData: FormData) {
    const { tenantId } = await requireTenantSession();

    const existing = await prisma.employee.findFirst({
        where: { id, tenantId },
    });
    if (!existing) return { success: false, error: "Employee not found" };

    try {
        await prisma.employee.update({
            where: { id },
            data: {
                firstName: formData.get("firstName") as string,
                lastName: formData.get("lastName") as string,
                email: formData.get("email") as string,
                phone: (formData.get("phone") as string) || null,
                department: (formData.get("department") as string) || null,
                jobTitle: (formData.get("jobTitle") as string) || null,
                role: ((formData.get("role") as string) || existing.role) as Role,
                basicSalary: parseFloat(formData.get("basicSalary") as string) || Number(existing.basicSalary),
                allowances: parseFloat(formData.get("allowances") as string) || 0,
                bankName: (formData.get("bankName") as string) || null,
                bankAccount: (formData.get("bankAccount") as string) || null,
                ssnit: (formData.get("ssnit") as string) || null,
                tin: (formData.get("tin") as string) || null,
                startDate: formData.get("startDate")
                    ? new Date(formData.get("startDate") as string)
                    : existing.startDate,
            },
        });
        revalidatePath("/employees");
        revalidatePath(`/employees/${id}`);
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update employee";
        return { success: false, error: msg };
    }
}

export async function deleteEmployee(id: string) {
    const { tenantId } = await requireTenantSession();

    const existing = await prisma.employee.findFirst({
        where: { id, tenantId },
    });
    if (!existing) return { success: false, error: "Employee not found" };

    // Soft-delete: set status to TERMINATED
    await prisma.employee.update({
        where: { id },
        data: { status: "TERMINATED" as EmployeeStatus },
    });
    revalidatePath("/employees");
    return { success: true };
}

export async function updateEmployeeStatus(id: string, status: EmployeeStatus) {
    const { tenantId } = await requireTenantSession();

    const existing = await prisma.employee.findFirst({
        where: { id, tenantId },
    });
    if (!existing) return { success: false, error: "Employee not found" };

    await prisma.employee.update({
        where: { id },
        data: { status },
    });
    revalidatePath("/employees");
    revalidatePath(`/employees/${id}`);
    return { success: true };
}

export async function getEmployeeOnboarding(id: string) {
    const { tenantId } = await requireTenantSession();
    const e = await prisma.employee.findFirst({
        where: { id, tenantId },
        select: {
            id: true,
            onboardBankDetails: true,
            onboardSsnit: true,
            onboardTin: true,
            onboardContract: true,
            onboardIdDocument: true,
            onboardEmergContact: true,
        },
    });
    return e;
}

export async function updateOnboardingItem(id: string, field: string, value: boolean) {
    const { tenantId } = await requireTenantSession();
    const existing = await prisma.employee.findFirst({ where: { id, tenantId } });
    if (!existing) return { success: false, error: "Employee not found" };

    const validFields = [
        "onboardBankDetails",
        "onboardSsnit",
        "onboardTin",
        "onboardContract",
        "onboardIdDocument",
        "onboardEmergContact",
    ];
    if (!validFields.includes(field)) return { success: false, error: "Invalid field" };

    await prisma.employee.update({
        where: { id },
        data: { [field]: value },
    });
    revalidatePath(`/employees/${id}`);
    return { success: true };
}
