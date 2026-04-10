import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "salaryhub-dev-secret-change-in-production"
);

const REFRESH_SECRET = new TextEncoder().encode(
    (process.env.AUTH_SECRET || "salaryhub-dev-secret") + "-refresh"
);

export interface JWTPayload {
    sub: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    employeeId: string;
}

/** Sign a JWT access token (1 hour) */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(JWT_SECRET);
}

/** Sign a refresh token (30 days) */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ sub: payload.sub } as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(REFRESH_SECRET);
}

/** Verify an access token */
export async function verifyAccessToken(
    token: string
): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

/** Verify a refresh token */
export async function verifyRefreshToken(
    token: string
): Promise<{ sub: string } | null> {
    try {
        const { payload } = await jwtVerify(token, REFRESH_SECRET);
        return payload as unknown as { sub: string };
    } catch {
        return null;
    }
}

/** Extract and verify JWT from Authorization header */
export async function authenticateRequest(
    request: NextRequest
): Promise<JWTPayload | null> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    return verifyAccessToken(token);
}

/** Standard API error response */
export function apiError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

/** Standard API success response */
export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ data }, { status });
}
