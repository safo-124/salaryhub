"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { ApprovalStatus } from "@/lib/generated/prisma/client";
import Decimal from "decimal.js";

export async function getOvertimeEntries() {
    const { tenantId } = await requireTenantSession();
    const entries = await prisma.overtimeEntry.findMany({
        where: { employee: { tenantId } },
        include: {
            employee: {
                select: { firstName: true, lastName: true, employeeId: true, basicSalary: true },
            },
        },
        orderBy: { date: "desc" },
    });
    return entries.map((e) => ({
        id: e.id,
        employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
        employeeCode: e.employee.employeeId,
        employeeId: e.employeeId,
        date: e.date.toISOString().split("T")[0],
        clockIn: e.clockIn.toISOString(),
        clockOut: e.clockOut.toISOString(),
        totalHours: Number(e.totalHours),
        overtimeHours: Number(e.overtimeHours),
        rate: Number(e.rate),
        amount: Number(e.amount),
        status: e.status,
        notes: e.notes,
        approvedBy: e.approvedBy,
    }));
}

export async function createOvertimeEntry(formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const employeeId = formData.get("employeeId") as string;
    const date = new Date(formData.get("date") as string);
    const clockIn = new Date(formData.get("clockIn") as string);
    const clockOut = new Date(formData.get("clockOut") as string);
    const breakMinutes = parseInt(formData.get("breakMinutes") as string) || 0;
    const rate = parseFloat(formData.get("rate") as string) || 1.5;
    const notes = (formData.get("notes") as string) || null;

    // Verify employee belongs to tenant
    const emp = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
    });
    if (!emp) return { success: false, error: "Employee not found" };

    // Calculate hours
    const totalMinutes =
        (clockOut.getTime() - clockIn.getTime()) / (1000 * 60) - breakMinutes;
    const totalHours = new Decimal(totalMinutes).dividedBy(60).toDecimalPlaces(2);
    const standardHours = new Decimal(8);
    const overtimeHours = Decimal.max(totalHours.minus(standardHours), new Decimal(0)).toDecimalPlaces(2);

    // Calculate amount: (basicSalary / 176) * overtimeHours * rate
    // 176 = standard monthly hours (22 days * 8 hours)
    const hourlyRate = new Decimal(String(emp.basicSalary)).dividedBy(176);
    const amount = hourlyRate
        .times(overtimeHours)
        .times(new Decimal(rate))
        .toDecimalPlaces(2);

    await prisma.overtimeEntry.create({
        data: {
            employeeId,
            date,
            clockIn,
            clockOut,
            breakMinutes,
            totalHours: totalHours.toNumber(),
            overtimeHours: overtimeHours.toNumber(),
            rate,
            amount: amount.toNumber(),
            notes,
        },
    });

    revalidatePath("/overtime");
    return { success: true };
}

export async function approveOvertimeEntry(id: string) {
    const { tenantId, userName } = await requireTenantSession();
    const entry = await prisma.overtimeEntry.findFirst({
        where: { id, employee: { tenantId } },
    });
    if (!entry) return { success: false, error: "Overtime entry not found" };
    if (entry.status !== "PENDING") {
        return { success: false, error: "Can only approve pending entries" };
    }

    await prisma.overtimeEntry.update({
        where: { id },
        data: {
            status: "APPROVED" as ApprovalStatus,
            approvedBy: userName,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/overtime");
    return { success: true };
}

export async function rejectOvertimeEntry(id: string) {
    const { tenantId, userName } = await requireTenantSession();
    const entry = await prisma.overtimeEntry.findFirst({
        where: { id, employee: { tenantId } },
    });
    if (!entry) return { success: false, error: "Overtime entry not found" };
    if (entry.status !== "PENDING") {
        return { success: false, error: "Can only reject pending entries" };
    }

    await prisma.overtimeEntry.update({
        where: { id },
        data: {
            status: "REJECTED" as ApprovalStatus,
            approvedBy: userName,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/overtime");
    return { success: true };
}

export async function bulkApproveOvertime(ids: string[]) {
    const { tenantId, userName } = await requireTenantSession();
    let count = 0;
    for (const id of ids) {
        const entry = await prisma.overtimeEntry.findFirst({
            where: { id, employee: { tenantId }, status: "PENDING" },
        });
        if (entry) {
            await prisma.overtimeEntry.update({
                where: { id },
                data: { status: "APPROVED", approvedBy: userName, approvedAt: new Date() },
            });
            count++;
        }
    }
    revalidatePath("/overtime");
    return { success: true, count };
}

export async function bulkRejectOvertime(ids: string[]) {
    const { tenantId, userName } = await requireTenantSession();
    let count = 0;
    for (const id of ids) {
        const entry = await prisma.overtimeEntry.findFirst({
            where: { id, employee: { tenantId }, status: "PENDING" },
        });
        if (entry) {
            await prisma.overtimeEntry.update({
                where: { id },
                data: { status: "REJECTED", approvedBy: userName, approvedAt: new Date() },
            });
            count++;
        }
    }
    revalidatePath("/overtime");
    return { success: true, count };
}
