"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";
import { LeaveType } from "@/lib/generated/prisma/client";

// Ghana standard leave entitlements (days per year)
const DEFAULT_ENTITLEMENTS: Record<string, number> = {
    ANNUAL: 15,
    SICK: 10,
    MATERNITY: 84,     // 12 weeks
    PATERNITY: 5,
    UNPAID: 30,
    COMPASSIONATE: 5,
};

/**
 * Initialize leave balances for an employee for a given year.
 * Creates records for all leave types if they don't already exist.
 */
export async function initLeaveBalances(employeeId: string, year?: number) {
    const currentYear = year ?? new Date().getFullYear();
    const types = Object.keys(DEFAULT_ENTITLEMENTS) as LeaveType[];

    for (const type of types) {
        const existing = await prisma.leaveBalance.findUnique({
            where: { employeeId_type_year: { employeeId, type, year: currentYear } },
        });
        if (!existing) {
            // Check if there's a carry-over from last year (only for ANNUAL)
            let carried = 0;
            if (type === "ANNUAL") {
                const prev = await prisma.leaveBalance.findUnique({
                    where: { employeeId_type_year: { employeeId, type, year: currentYear - 1 } },
                });
                if (prev) {
                    const remaining = prev.entitled + prev.carried - prev.used;
                    carried = Math.min(Math.max(remaining, 0), 5); // max 5 days carry-over
                }
            }
            await prisma.leaveBalance.create({
                data: {
                    employeeId,
                    type,
                    year: currentYear,
                    entitled: DEFAULT_ENTITLEMENTS[type],
                    carried,
                },
            });
        }
    }
}

/**
 * Get leave balances for all employees in the tenant for a given year.
 */
export async function getLeaveBalances(year?: number) {
    const { tenantId } = await requireTenantSession();
    const currentYear = year ?? new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
        where: {
            year: currentYear,
            employee: { tenantId },
        },
        include: {
            employee: { select: { firstName: true, lastName: true, employeeId: true } },
        },
        orderBy: [{ employee: { firstName: "asc" } }, { type: "asc" }],
    });

    return balances.map((b) => ({
        id: b.id,
        employeeId: b.employeeId,
        employeeName: `${b.employee.firstName} ${b.employee.lastName}`,
        employeeCode: b.employee.employeeId,
        type: b.type,
        year: b.year,
        entitled: b.entitled,
        carried: b.carried,
        used: b.used,
        pending: b.pending,
        remaining: b.entitled + b.carried - b.used - b.pending,
    }));
}

/**
 * Get leave balances for a single employee (used in leave form).
 */
export async function getEmployeeLeaveBalances(employeeId: string, year?: number) {
    const currentYear = year ?? new Date().getFullYear();

    // Auto-initialize if needed
    await initLeaveBalances(employeeId, currentYear);

    const balances = await prisma.leaveBalance.findMany({
        where: { employeeId, year: currentYear },
        orderBy: { type: "asc" },
    });

    return balances.map((b) => ({
        type: b.type,
        entitled: b.entitled,
        carried: b.carried,
        used: b.used,
        pending: b.pending,
        remaining: b.entitled + b.carried - b.used - b.pending,
    }));
}

/**
 * Deduct from leave balance when a request is approved.
 */
export async function deductLeaveBalance(employeeId: string, type: LeaveType, days: number, year: number) {
    await initLeaveBalances(employeeId, year);

    const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_type_year: { employeeId, type, year } },
    });
    if (!balance) return;

    await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
            used: { increment: days },
            pending: { decrement: Math.min(days, balance.pending) },
        },
    });
}

/**
 * Add to pending when a request is submitted.
 */
export async function addPendingLeave(employeeId: string, type: LeaveType, days: number, year: number) {
    await initLeaveBalances(employeeId, year);

    await prisma.leaveBalance.updateMany({
        where: { employeeId, type, year },
        data: { pending: { increment: days } },
    });
}

/**
 * Remove from pending when a request is rejected.
 */
export async function removePendingLeave(employeeId: string, type: LeaveType, days: number, year: number) {
    const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_type_year: { employeeId, type, year } },
    });
    if (!balance) return;

    await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: Math.min(days, balance.pending) } },
    });
}
