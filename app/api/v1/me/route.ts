import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    const user = await authenticateRequest(request);
    if (!user) return apiError("Unauthorized", 401);

    // TODO: Fetch full profile from DB
    return apiSuccess({
        id: user.sub,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        employeeId: user.employeeId,
    });
}
