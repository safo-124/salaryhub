import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const doc = await prisma.document.findFirst({
        where: { id, tenantId: session.user.tenantId },
    });

    if (!doc) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(doc.fileData), {
        headers: {
            "Content-Type": doc.fileType,
            "Content-Disposition": `inline; filename="${doc.fileName}"`,
            "Content-Length": String(doc.fileSize),
        },
    });
}
