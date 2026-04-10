import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiSuccess } from "@/lib/api-auth";
import { getEmployees } from "@/lib/actions/employees";

export async function GET(request: NextRequest) {
    const user = await authenticateRequest(request);
    if (!user) return apiError("Unauthorized", 401);

    // Only admins can list employees
    if (!["OWNER", "PAYROLL_ADMIN", "HR_MANAGER"].includes(user.role)) {
        return apiError("Forbidden", 403);
    }

    const employees = await getEmployees();
    return apiSuccess({ employees });
}
