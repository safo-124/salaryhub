"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";

export async function getSalaryStructures() {
    const { tenantId } = await requireTenantSession();
    const structures = await prisma.salaryStructure.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
    });
    return structures.map((s) => ({
        id: s.id,
        name: s.name,
        components: s.components as { name: string; type: "earning" | "deduction"; calcType: "fixed" | "percentage"; value: number }[],
        createdAt: s.createdAt.toISOString(),
    }));
}

export async function createSalaryStructure(name: string, components: { name: string; type: "earning" | "deduction"; calcType: "fixed" | "percentage"; value: number }[]) {
    const { tenantId } = await requireTenantSession();
    if (!name.trim()) return { success: false, error: "Name is required" };
    if (components.length === 0) return { success: false, error: "At least one component is required" };

    await prisma.salaryStructure.create({
        data: { tenantId, name: name.trim(), components: JSON.parse(JSON.stringify(components)) },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function deleteSalaryStructure(id: string) {
    const { tenantId } = await requireTenantSession();
    const structure = await prisma.salaryStructure.findFirst({ where: { id, tenantId } });
    if (!structure) return { success: false, error: "Not found" };

    await prisma.salaryStructure.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
}
