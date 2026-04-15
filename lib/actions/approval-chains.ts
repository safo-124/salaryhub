"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { requireRole } from "./permissions";
import { ApprovalCategory } from "@/lib/generated/prisma/client";

export type ApprovalStep = {
    order: number;
    role: string;
    label: string;
};

export async function getApprovalChains() {
    const { tenantId } = await requireTenantSession();

    const chains = await prisma.approvalChain.findMany({
        where: { tenantId },
        orderBy: { category: "asc" },
    });

    return chains.map((c) => ({
        id: c.id,
        category: c.category,
        steps: c.steps as ApprovalStep[],
        isActive: c.isActive,
    }));
}

export async function getApprovalChain(category: ApprovalCategory) {
    const { tenantId } = await requireTenantSession();

    const chain = await prisma.approvalChain.findUnique({
        where: { tenantId_category: { tenantId, category } },
    });

    if (!chain || !chain.isActive) return null;
    return {
        id: chain.id,
        steps: chain.steps as ApprovalStep[],
    };
}

export async function upsertApprovalChain(
    category: ApprovalCategory,
    steps: ApprovalStep[],
    isActive: boolean
) {
    await requireRole("OWNER");
    const { tenantId } = await requireTenantSession();

    // Validate steps
    if (steps.length === 0 && isActive) {
        return { success: false, error: "Active chains need at least one step" };
    }

    for (const step of steps) {
        if (!step.role || !step.label || step.order < 1) {
            return { success: false, error: "Each step needs a role, label, and order" };
        }
    }

    // Sort by order
    const sorted = [...steps].sort((a, b) => a.order - b.order);

    await prisma.approvalChain.upsert({
        where: { tenantId_category: { tenantId, category } },
        create: { tenantId, category, steps: sorted, isActive },
        update: { steps: sorted, isActive },
    });

    revalidatePath("/settings");
    return { success: true };
}

/**
 * Initialize approval records for a new request based on the chain.
 * Returns true if a chain exists and records were created.
 */
export async function initApprovalRecords(
    category: "LEAVE" | "OVERTIME",
    requestId: string
) {
    const { tenantId } = await requireTenantSession();

    const chain = await prisma.approvalChain.findUnique({
        where: {
            tenantId_category: {
                tenantId,
                category: category as ApprovalCategory,
            },
        },
    });

    if (!chain || !chain.isActive) return false;

    const steps = chain.steps as ApprovalStep[];
    if (steps.length === 0) return false;

    // Create approval records for each step
    for (const step of steps) {
        await prisma.approvalRecord.create({
            data: {
                tenantId,
                category,
                requestId,
                stepOrder: step.order,
                stepRole: step.role,
                stepLabel: step.label,
                action: "PENDING",
            },
        });
    }

    return true;
}

/**
 * Get the approval status for a request (all steps).
 */
export async function getApprovalStatus(requestId: string) {
    const { tenantId } = await requireTenantSession();

    const records = await prisma.approvalRecord.findMany({
        where: { requestId, tenantId },
        orderBy: { stepOrder: "asc" },
    });

    if (records.length === 0) return null;

    return records.map((r) => ({
        id: r.id,
        stepOrder: r.stepOrder,
        stepRole: r.stepRole,
        stepLabel: r.stepLabel,
        action: r.action,
        actorName: r.actorName,
        comment: r.comment,
        actedAt: r.actedAt?.toISOString() ?? null,
    }));
}

/**
 * Process an approval step for a request.
 * Returns the next pending step or null if all approved.
 */
export async function processApprovalStep(
    requestId: string,
    action: "APPROVED" | "REJECTED",
    comment?: string
) {
    const session = await requireTenantSession();

    // Get all steps for this request
    const records = await prisma.approvalRecord.findMany({
        where: { requestId, tenantId: session.tenantId },
        orderBy: { stepOrder: "asc" },
    });

    if (records.length === 0) {
        return { success: false, error: "No approval chain for this request" };
    }

    // Find the next pending step
    const nextPending = records.find((r) => r.action === "PENDING");
    if (!nextPending) {
        return { success: false, error: "All steps already processed" };
    }

    // Check if user's role matches the required step role
    const roleLevel: Record<string, number> = {
        OWNER: 5,
        PAYROLL_ADMIN: 4,
        HR_MANAGER: 3,
        SUPERVISOR: 2,
        EMPLOYEE: 1,
    };
    const userLevel = roleLevel[session.role ?? "EMPLOYEE"] || 1;
    const requiredLevel = roleLevel[nextPending.stepRole] || 1;

    if (userLevel < requiredLevel) {
        return {
            success: false,
            error: `This step requires ${nextPending.stepRole} or higher`,
        };
    }

    // Update the step
    await prisma.approvalRecord.update({
        where: { id: nextPending.id },
        data: {
            action,
            actorId: session.userId,
            actorName: session.userName,
            comment: comment || null,
            actedAt: new Date(),
        },
    });

    // If rejected, mark all remaining steps as rejected too
    if (action === "REJECTED") {
        const remaining = records.filter(
            (r) => r.action === "PENDING" && r.id !== nextPending.id
        );
        for (const r of remaining) {
            await prisma.approvalRecord.update({
                where: { id: r.id },
                data: { action: "REJECTED" },
            });
        }
        return { success: true, finalAction: "REJECTED" as const };
    }

    // Check if all steps are now approved
    const allApproved = records.every(
        (r) => r.id === nextPending.id || r.action === "APPROVED"
    );

    if (allApproved) {
        return { success: true, finalAction: "APPROVED" as const };
    }

    return { success: true, finalAction: null };
}
