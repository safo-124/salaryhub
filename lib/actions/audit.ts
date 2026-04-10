"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";

export async function getTenantAuditLogs() {
    const { tenantId, userId } = await requireTenantSession();
    // Get all audit logs where the actor is from this tenant
    const logs = await prisma.auditLog.findMany({
        where: {
            OR: [
                { actorId: userId },
                { metadata: { path: ["tenantId"], equals: tenantId } },
                { target: { contains: tenantId } },
            ],
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    return logs.map((l) => ({
        id: l.id,
        action: l.action,
        target: l.target,
        targetId: l.targetId,
        actorName: l.actorName,
        metadata: l.metadata as Record<string, unknown> | null,
        createdAt: l.createdAt.toISOString(),
    }));
}

export async function logTenantAction(
    action: string,
    target: string,
    actorId: string,
    actorName: string,
    tenantId: string,
    targetId?: string,
    metadata?: Record<string, unknown>
) {
    await prisma.auditLog.create({
        data: {
            action,
            target,
            targetId,
            actorId,
            actorName,
            metadata: metadata
                ? JSON.parse(JSON.stringify({ ...metadata, tenantId }))
                : { tenantId },
        },
    });
}
