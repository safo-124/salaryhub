"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { NotificationType } from "@/lib/generated/prisma/client";

export async function getNotifications() {
    const { tenantId } = await requireTenantSession();
    const notifications = await prisma.notification.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    return notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        linkUrl: n.linkUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
    }));
}

export async function getUnreadCount() {
    const { tenantId } = await requireTenantSession();
    return prisma.notification.count({
        where: { tenantId, isRead: false },
    });
}

export async function markAsRead(id: string) {
    const { tenantId } = await requireTenantSession();
    const notif = await prisma.notification.findFirst({ where: { id, tenantId } });
    if (!notif) return { success: false };
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    revalidatePath("/notifications");
    return { success: true };
}

export async function markAllAsRead() {
    const { tenantId } = await requireTenantSession();
    await prisma.notification.updateMany({
        where: { tenantId, isRead: false },
        data: { isRead: true },
    });
    revalidatePath("/notifications");
    return { success: true };
}

export async function createNotification(
    tenantId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string,
    recipientId?: string
) {
    await prisma.notification.create({
        data: { tenantId, type, title, message, linkUrl, recipientId },
    });
}
