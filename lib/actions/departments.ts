"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";

export async function getDepartments() {
    const { tenantId } = await requireTenantSession();
    const departments = await prisma.department.findMany({
        where: { tenantId },
        include: { _count: { select: { employees: true } } },
        orderBy: { name: "asc" },
    });
    return departments.map((d) => ({
        id: d.id,
        name: d.name,
        headId: d.headId,
        employeeCount: d._count.employees,
        createdAt: d.createdAt.toISOString(),
    }));
}

export async function createDepartment(formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const name = (formData.get("name") as string).trim();
    if (!name) return { success: false, error: "Department name is required" };

    const existing = await prisma.department.findUnique({
        where: { tenantId_name: { tenantId, name } },
    });
    if (existing) return { success: false, error: "Department already exists" };

    await prisma.department.create({
        data: { tenantId, name, headId: (formData.get("headId") as string) || null },
    });

    revalidatePath("/departments");
    revalidatePath("/employees");
    return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
    const { tenantId } = await requireTenantSession();
    const name = (formData.get("name") as string).trim();
    if (!name) return { success: false, error: "Department name is required" };

    const dept = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) return { success: false, error: "Department not found" };

    await prisma.department.update({
        where: { id },
        data: { name, headId: (formData.get("headId") as string) || null },
    });

    revalidatePath("/departments");
    revalidatePath("/employees");
    return { success: true };
}

export async function deleteDepartment(id: string) {
    const { tenantId } = await requireTenantSession();
    const dept = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) return { success: false, error: "Department not found" };

    // Unlink employees before deleting
    await prisma.employee.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
    });

    await prisma.department.delete({ where: { id } });
    revalidatePath("/departments");
    revalidatePath("/employees");
    return { success: true };
}
