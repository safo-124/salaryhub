"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";

export async function getDashboardStats() {
    const { tenantId } = await requireTenantSession();

    const [employeeCount, pendingLeaves, pendingOvertime, latestRun, paidRun] =
        await Promise.all([
            prisma.employee.count({
                where: { tenantId, status: "ACTIVE" },
            }),
            prisma.leaveRequest.count({
                where: {
                    employee: { tenantId },
                    status: "PENDING",
                },
            }),
            prisma.overtimeEntry.count({
                where: {
                    employee: { tenantId },
                    status: "PENDING",
                },
            }),
            prisma.payrollRun.findFirst({
                where: { tenantId },
                orderBy: { createdAt: "desc" },
                select: { totalNet: true, period: true, status: true },
            }),
            prisma.payrollRun.findFirst({
                where: { tenantId, status: "PAID" },
                orderBy: { createdAt: "desc" },
                select: { totalNet: true, period: true },
            }),
        ]);

    const pendingApprovals = pendingLeaves + pendingOvertime;
    const lastPayroll = paidRun ?? latestRun;

    return {
        employeeCount,
        pendingApprovals,
        totalPayroll: lastPayroll ? Number(lastPayroll.totalNet) : 0,
        lastPeriod: lastPayroll?.period ?? null,
    };
}

export async function getRecentPayrollRuns() {
    const { tenantId } = await requireTenantSession();

    const runs = await prisma.payrollRun.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    return runs.map((r) => ({
        id: r.id,
        period: r.period,
        status: r.status,
        totalNet: Number(r.totalNet),
        employeeCount: r.employeeCount,
        processedAt: r.processedAt?.toISOString() ?? null,
    }));
}

export async function getPayrollChartData() {
    const { tenantId } = await requireTenantSession();

    const runs = await prisma.payrollRun.findMany({
        where: { tenantId },
        orderBy: { period: "asc" },
        take: 12,
        select: { period: true, totalGross: true, totalNet: true, totalTax: true, employeeCount: true },
    });

    return runs.map((r) => ({
        period: r.period,
        gross: Number(r.totalGross),
        net: Number(r.totalNet),
        tax: Number(r.totalTax),
        employees: r.employeeCount,
    }));
}

export async function getLeaveStats() {
    const { tenantId } = await requireTenantSession();

    const requests = await prisma.leaveRequest.findMany({
        where: { employee: { tenantId } },
        select: { type: true, status: true },
    });

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const r of requests) {
        byType[r.type] = (byType[r.type] || 0) + 1;
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }

    return {
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    };
}
