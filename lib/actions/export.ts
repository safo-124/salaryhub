"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";

export async function exportEmployeesCSV() {
    const { tenantId } = await requireTenantSession();
    const employees = await prisma.employee.findMany({
        where: { tenantId },
        orderBy: { employeeId: "asc" },
    });

    const headers = ["Employee ID", "First Name", "Last Name", "Email", "Phone", "Department", "Job Title", "Role", "Basic Salary", "Allowances", "Status", "Start Date"];
    const rows = employees.map((e) => [
        e.employeeId,
        e.firstName,
        e.lastName,
        e.email,
        e.phone || "",
        e.department || "",
        e.jobTitle || "",
        e.role,
        Number(e.basicSalary).toFixed(2),
        Number(e.allowances).toFixed(2),
        e.status,
        e.startDate.toISOString().split("T")[0],
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function exportPayslipsCSV(payrollRunId?: string) {
    const { tenantId } = await requireTenantSession();
    const where = payrollRunId
        ? { payrollRunId, payrollRun: { tenantId } }
        : { payrollRun: { tenantId } };

    const payslips = await prisma.payslip.findMany({
        where,
        include: {
            employee: { select: { firstName: true, lastName: true, employeeId: true } },
            payrollRun: { select: { period: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const headers = ["Period", "Employee ID", "Name", "Basic Salary", "Allowances", "Overtime", "Gross Pay", "SSNIT (Employee)", "SSNIT (Employer)", "Tier 2", "PAYE", "Other Deductions", "Net Pay", "Status"];
    const rows = payslips.map((s) => [
        s.payrollRun.period,
        s.employee.employeeId,
        `${s.employee.firstName} ${s.employee.lastName}`,
        Number(s.basicSalary).toFixed(2),
        Number(s.allowances).toFixed(2),
        Number(s.overtime).toFixed(2),
        Number(s.grossPay).toFixed(2),
        Number(s.ssnitEmployee).toFixed(2),
        Number(s.ssnitEmployer).toFixed(2),
        Number(s.tier2).toFixed(2),
        Number(s.paye).toFixed(2),
        Number(s.otherDeductions).toFixed(2),
        Number(s.netPay).toFixed(2),
        s.payrollRun.status,
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function exportLeaveCSV() {
    const { tenantId } = await requireTenantSession();
    const requests = await prisma.leaveRequest.findMany({
        where: { employee: { tenantId } },
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
        orderBy: { createdAt: "desc" },
    });

    const headers = ["Employee ID", "Name", "Type", "Start Date", "End Date", "Days", "Status", "Approved By", "Created At"];
    const rows = requests.map((r) => [
        r.employee.employeeId,
        `${r.employee.firstName} ${r.employee.lastName}`,
        r.type,
        r.startDate.toISOString().split("T")[0],
        r.endDate.toISOString().split("T")[0],
        r.days,
        r.status,
        r.approvedBy || "",
        r.createdAt.toISOString().split("T")[0],
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}
