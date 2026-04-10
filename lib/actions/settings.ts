"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";

export async function getTenantSettings() {
    const { tenantId } = await requireTenantSession();
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            plan: true,
            status: true,
            maxEmployees: true,
            billingEmail: true,
            _count: { select: { employees: true } },
        },
    });
    if (!tenant) throw new Error("Tenant not found");
    return {
        ...tenant,
        employeeCount: tenant._count.employees,
    };
}

export async function updateTenantSettings(formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const billingEmail = (formData.get("billingEmail") as string) || null;

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { billingEmail },
    });

    revalidatePath("/settings");
    return { success: true };
}
