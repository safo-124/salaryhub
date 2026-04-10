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
