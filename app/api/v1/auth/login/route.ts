import { NextRequest } from "next/server";
import {
    signAccessToken,
    signRefreshToken,
    apiError,
    apiSuccess,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body?.email || !body?.password) {
        return apiError("Email and password are required", 400);
    }

    const { email, password } = body;

    // TODO: Replace with real DB lookup when Prisma is connected
    if (email === "admin@salaryhub.com" && password === "admin123") {
        const payload = {
            sub: "demo-owner-id",
            email: "admin@salaryhub.com",
            name: "Admin User",
            role: "OWNER",
            tenantId: "demo-tenant",
            employeeId: "SH-0001",
        };

        const accessToken = await signAccessToken(payload);
        const refreshToken = await signRefreshToken(payload);

        return apiSuccess({
            accessToken,
            refreshToken,
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                role: payload.role,
                employeeId: payload.employeeId,
            },
        });
    }

    return apiError("Invalid credentials", 401);
}
