"use server";

import { requireTenantSession } from "./tenant-session";

// Role hierarchy: OWNER > PAYROLL_ADMIN > HR_MANAGER > SUPERVISOR > EMPLOYEE
const roleLevel: Record<string, number> = {
    OWNER: 5,
    PAYROLL_ADMIN: 4,
    HR_MANAGER: 3,
    SUPERVISOR: 2,
    EMPLOYEE: 1,
};

export async function requireRole(minimumRole: string) {
    const session = await requireTenantSession();
    const userLevel = roleLevel[session.role ?? "EMPLOYEE"] || 1;
    const requiredLevel = roleLevel[minimumRole] || 1;

    if (userLevel < requiredLevel) {
        throw new Error(`Insufficient permissions. Required: ${minimumRole}`);
    }

    return session;
}

export async function getUserPermissions() {
    const session = await requireTenantSession();
    const level = roleLevel[session.role ?? "EMPLOYEE"] || 1;

    return {
        ...session,
        canManageEmployees: level >= 3, // HR_MANAGER+
        canRunPayroll: level >= 4,     // PAYROLL_ADMIN+
        canApprovePayroll: level >= 4, // PAYROLL_ADMIN+
        canApproveLeave: level >= 2,   // SUPERVISOR+
        canApproveOvertime: level >= 2, // SUPERVISOR+
        canViewAllEmployees: level >= 2, // SUPERVISOR+
        canManageSettings: level >= 5,  // OWNER only
        canExport: level >= 3,          // HR_MANAGER+
        isEmployee: level === 1,
    };
}
