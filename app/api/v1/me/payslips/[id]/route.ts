import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/api-auth";
import { getPayslip } from "@/lib/actions/payroll";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await authenticateRequest(request);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const payslip = await getPayslip(id);

    if (!payslip) return apiError("Payslip not found", 404);

    // TODO: Verify payslip belongs to authenticated user

    return apiSuccess(payslip);
}
