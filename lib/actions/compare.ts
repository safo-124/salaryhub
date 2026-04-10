"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";

export async function getPayrollPeriodsForComparison() {
    const { tenantId } = await requireTenantSession();
    const runs = await prisma.payrollRun.findMany({
        where: { tenantId },
        orderBy: { period: "desc" },
        select: { id: true, period: true },
    });
    return runs;
}

export async function comparePayrolls(periodA: string, periodB: string) {
    const { tenantId } = await requireTenantSession();

    const [runA, runB] = await Promise.all([
        prisma.payrollRun.findFirst({
            where: { tenantId, period: periodA },
            include: {
                payslips: {
                    include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
                },
            },
        }),
        prisma.payrollRun.findFirst({
            where: { tenantId, period: periodB },
            include: {
                payslips: {
                    include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
                },
            },
        }),
    ]);

    if (!runA || !runB) return null;

    const summaryA = { period: runA.period, gross: Number(runA.totalGross), net: Number(runA.totalNet), tax: Number(runA.totalTax), count: runA.employeeCount };
    const summaryB = { period: runB.period, gross: Number(runB.totalGross), net: Number(runB.totalNet), tax: Number(runB.totalTax), count: runB.employeeCount };

    // Build per-employee comparison
    const mapA = new Map(runA.payslips.map((s) => [s.employeeId, s]));
    const mapB = new Map(runB.payslips.map((s) => [s.employeeId, s]));
    const allEmployeeIds = new Set([...mapA.keys(), ...mapB.keys()]);

    const employees = [...allEmployeeIds].map((empId) => {
        const a = mapA.get(empId);
        const b = mapB.get(empId);
        const name = a
            ? `${a.employee.firstName} ${a.employee.lastName}`
            : b
                ? `${b.employee.firstName} ${b.employee.lastName}`
                : "Unknown";
        const code = a?.employee.employeeId || b?.employee.employeeId || "";
        return {
            name,
            code,
            grossA: a ? Number(a.grossPay) : 0,
            grossB: b ? Number(b.grossPay) : 0,
            netA: a ? Number(a.netPay) : 0,
            netB: b ? Number(b.netPay) : 0,
        };
    });

    return { summaryA, summaryB, employees };
}
