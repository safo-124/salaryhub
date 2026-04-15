"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { DocumentType } from "@/lib/generated/prisma/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function getEmployeeDocuments(employeeId: string) {
    const { tenantId } = await requireTenantSession();

    // Verify employee belongs to tenant
    const emp = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
        select: { id: true },
    });
    if (!emp) return [];

    const docs = await prisma.document.findMany({
        where: { employeeId, tenantId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedBy: true,
            createdAt: true,
        },
    });

    return docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        uploadedBy: d.uploadedBy,
        createdAt: d.createdAt.toISOString(),
    }));
}

export async function uploadDocument(formData: FormData) {
    const { tenantId, userName } = await requireTenantSession();

    const employeeId = formData.get("employeeId") as string;
    const name = (formData.get("name") as string)?.trim();
    const type = (formData.get("type") as DocumentType) || "OTHER";
    const file = formData.get("file") as File;

    if (!employeeId || !name || !file) {
        return { success: false, error: "Missing required fields" };
    }

    // Verify employee belongs to tenant
    const emp = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
        select: { id: true },
    });
    if (!emp) return { success: false, error: "Employee not found" };

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: "File too large (max 5MB)" };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { success: false, error: "File type not allowed. Use PDF, JPEG, PNG, WebP, or Word documents." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await prisma.document.create({
        data: {
            tenantId,
            employeeId,
            name,
            type,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: buffer,
            uploadedBy: userName,
        },
    });

    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
}

export async function deleteDocument(documentId: string) {
    const { tenantId } = await requireTenantSession();

    const doc = await prisma.document.findFirst({
        where: { id: documentId, tenantId },
        select: { id: true, employeeId: true },
    });
    if (!doc) return { success: false, error: "Document not found" };

    await prisma.document.delete({ where: { id: documentId } });

    revalidatePath(`/employees/${doc.employeeId}`);
    return { success: true };
}

export async function getDocumentData(documentId: string) {
    const { tenantId } = await requireTenantSession();

    const doc = await prisma.document.findFirst({
        where: { id: documentId, tenantId },
    });
    if (!doc) return null;

    return {
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileData: Buffer.from(doc.fileData).toString("base64"),
    };
}
