import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const user = await authenticateRequest(request);
    if (!user) return apiError("Unauthorized", 401);

    const payslips = await prisma.payslip.findMany({
        where: { employeeId: user.employeeId },
        include: { payrollRun: { select: { status: true } } },
        orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
        payslips: payslips.map((p) => ({
            id: p.id,
            period: p.period,
            grossPay: Number(p.grossPay),
            netPay: Number(p.netPay),
            status: p.payrollRun.status,
        })),
    });
}
