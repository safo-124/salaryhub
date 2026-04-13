"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { LeaveType } from "@/lib/generated/prisma/client";
import { addPendingLeave } from "./leave-balances";

/**
 * Allow an employee to update their own limited profile fields:
 * phone, bankName, bankAccount
 */
export async function updateOwnProfile(formData: FormData) {
    const session = await requireTenantSession();
    if (!session.employeeId) {
        return { success: false, error: "No employee profile linked" };
    }

    const phone = (formData.get("phone") as string)?.trim() || null;
    const bankName = (formData.get("bankName") as string)?.trim() || null;
    const bankAccount = (formData.get("bankAccount") as string)?.trim() || null;

    // Validate phone format if provided
    if (phone && !/^[\d+\-() ]{7,20}$/.test(phone)) {
        return { success: false, error: "Invalid phone number format" };
    }

    await prisma.employee.update({
        where: { id: session.employeeId },
        data: { phone, bankName, bankAccount },
    });

    revalidatePath("/profile");
    return { success: true };
}

/**
 * Employee submits their own leave request (auto-fills employeeId from session)
 */
export async function requestOwnLeave(formData: FormData) {
    const session = await requireTenantSession();
    if (!session.employeeId) {
        return { success: false, error: "No employee profile linked" };
    }

    const type = formData.get("type") as LeaveType;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const reason = (formData.get("reason") as string)?.trim() || null;

    if (!type || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { success: false, error: "Please fill all required fields" };
    }

    if (endDate < startDate) {
        return { success: false, error: "End date must be on or after start date" };
    }

    const days =
        Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

    await prisma.leaveRequest.create({
        data: {
            employeeId: session.employeeId,
            type,
            startDate,
            endDate,
            days,
            reason,
        },
    });

    const year = startDate.getFullYear();
    await addPendingLeave(session.employeeId, type, days, year);

    revalidatePath("/profile");
    revalidatePath("/leave");
    return { success: true };
}

/**
 * Get leave balances for the current employee
 */
export async function getOwnLeaveBalances() {
    const session = await requireTenantSession();
    if (!session.employeeId) return [];

    const year = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
        where: { employeeId: session.employeeId, year },
    });

    return balances.map((b) => ({
        type: b.type,
        entitled: b.entitled,
        used: b.used,
        pending: b.pending,
        carried: b.carried,
        remaining: b.entitled + b.carried - b.used - b.pending,
    }));
}
