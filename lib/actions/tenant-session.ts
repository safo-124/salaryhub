"use server";

import { auth } from "@/lib/auth";

/**
 * Get the current tenant ID from the session.
 * Throws if not authenticated or not a tenant user.
 */
export async function requireTenantSession() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const tenantId = session.user.tenantId;
    if (!tenantId) throw new Error("Not a tenant user");

    return {
        tenantId,
        userId: session.user.id,
        userName: session.user.name ?? "Unknown",
        role: session.user.role,
        employeeId: session.user.employeeId,
    };
}
