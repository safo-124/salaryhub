"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { LeaveType, ApprovalStatus } from "@/lib/generated/prisma/client";

export async function getLeaveRequests() {
    const { tenantId } = await requireTenantSession();
    const requests = await prisma.leaveRequest.findMany({
        where: { employee: { tenantId } },
        include: {
            employee: {
                select: { firstName: true, lastName: true, employeeId: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => ({
        id: r.id,
        employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
        employeeCode: r.employee.employeeId,
        employeeId: r.employeeId,
        type: r.type,
        startDate: r.startDate.toISOString().split("T")[0],
        endDate: r.endDate.toISOString().split("T")[0],
        days: r.days,
        reason: r.reason,
        status: r.status,
        approvedBy: r.approvedBy,
        createdAt: r.createdAt.toISOString(),
    }));
}

export async function createLeaveRequest(formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as LeaveType;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const reason = (formData.get("reason") as string) || null;

    // Verify employee belongs to tenant
    const emp = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
    });
    if (!emp) return { success: false, error: "Employee not found" };

    // Calculate business days
    const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    await prisma.leaveRequest.create({
        data: { employeeId, type, startDate, endDate, days, reason },
    });

    revalidatePath("/leave");
    return { success: true };
}

export async function approveLeaveRequest(id: string) {
    const { tenantId, userName } = await requireTenantSession();
    const request = await prisma.leaveRequest.findFirst({
        where: { id, employee: { tenantId } },
    });
    if (!request) return { success: false, error: "Leave request not found" };
    if (request.status !== "PENDING") {
        return { success: false, error: "Can only approve pending requests" };
    }

    await prisma.leaveRequest.update({
        where: { id },
        data: {
            status: "APPROVED" as ApprovalStatus,
            approvedBy: userName,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/leave");
    return { success: true };
}

export async function rejectLeaveRequest(id: string) {
    const { tenantId, userName } = await requireTenantSession();
    const request = await prisma.leaveRequest.findFirst({
        where: { id, employee: { tenantId } },
    });
    if (!request) return { success: false, error: "Leave request not found" };
    if (request.status !== "PENDING") {
        return { success: false, error: "Can only reject pending requests" };
    }

    await prisma.leaveRequest.update({
        where: { id },
        data: {
            status: "REJECTED" as ApprovalStatus,
            approvedBy: userName,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/leave");
    return { success: true };
}
