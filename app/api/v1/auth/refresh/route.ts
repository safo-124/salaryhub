import { NextRequest } from "next/server";
import {
    verifyRefreshToken,
    signAccessToken,
    signRefreshToken,
    apiError,
    apiSuccess,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body?.refreshToken) {
        return apiError("Refresh token is required", 400);
    }

    const decoded = await verifyRefreshToken(body.refreshToken);
    if (!decoded) {
        return apiError("Invalid or expired refresh token", 401);
    }

    // TODO: Look up user from DB by decoded.sub
    // For now, use demo user
    const payload = {
        sub: decoded.sub,
        email: "admin@salaryhub.com",
        name: "Admin User",
        role: "OWNER",
        tenantId: "demo-tenant",
        employeeId: "SH-0001",
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    return apiSuccess({ accessToken, refreshToken });
}
