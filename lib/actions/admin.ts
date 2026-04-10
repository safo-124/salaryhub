"use server";

import prisma from "@/lib/prisma";
import { Plan, TenantStatus, AnnouncementType, InvoiceStatus } from "@/lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { SignJWT, jwtVerify } from "jose";

// ─── Helpers ─────────────────────────────────────────────

const MAX_EMPLOYEES: Record<Plan, number> = {
    STARTER: 25,
    PROFESSIONAL: 100,
    ENTERPRISE: 500,
};

const PLAN_PRICE: Record<Plan, number> = {
    STARTER: 99,
    PROFESSIONAL: 299,
    ENTERPRISE: 799,
};

const impersonationSecret = new TextEncoder().encode(
    process.env.AUTH_SECRET || "fallback-secret"
);

function toNumber(val: unknown): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return val;
    return Number(val);
}

async function logAction(
    action: string,
    target: string,
    actorId: string,
    actorName: string,
    targetId?: string,
    metadata?: Record<string, unknown>
) {
    await prisma.auditLog.create({
        data: {
            action,
            target,
            targetId,
            actorId,
            actorName,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
    });
}

// ─── Tenant Queries ──────────────────────────────────────

export async function getTenants(search?: string, status?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (status && status !== "ALL") {
        where.status = status as TenantStatus;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
        ];
    }

    const tenants = await prisma.tenant.findMany({
        where,
        include: {
            _count: { select: { employees: true, payrollRuns: true } },
            employees: {
                where: { role: "OWNER" },
                select: { firstName: true, lastName: true, email: true },
                take: 1,
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return tenants.map((t) => {
        const owner = t.employees[0];
        return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            country: t.country,
            plan: t.plan,
            status: t.status,
            maxEmployees: t.maxEmployees,
            employeeCount: t._count.employees,
            totalPayrollRuns: t._count.payrollRuns,
            monthlyPayroll: 0, // computed from payroll runs below
            createdAt: t.createdAt.toISOString(),
            ownerName: owner ? `${owner.firstName} ${owner.lastName}` : "—",
            ownerEmail: owner?.email ?? "—",
        };
    });
}

export async function getTenant(id: string) {
    const t = await prisma.tenant.findUnique({
        where: { id, deletedAt: null },
        include: {
            _count: { select: { employees: true, payrollRuns: true } },
            employees: {
                where: { role: "OWNER" },
                select: { firstName: true, lastName: true, email: true },
                take: 1,
            },
        },
    });

    if (!t) return null;

    const owner = t.employees[0];
    return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        country: t.country,
        plan: t.plan,
        status: t.status,
        maxEmployees: t.maxEmployees,
        employeeCount: t._count.employees,
        totalPayrollRuns: t._count.payrollRuns,
        monthlyPayroll: 0,
        createdAt: t.createdAt.toISOString(),
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : "—",
        ownerEmail: owner?.email ?? "—",
    };
}

export async function getPlatformStats() {
    const [totalTenants, activeTenants, suspendedTenants, totalEmployees, totalPayrollRuns, planCounts] =
        await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { status: "ACTIVE" } }),
            prisma.tenant.count({ where: { status: "SUSPENDED" } }),
            prisma.employee.count(),
            prisma.payrollRun.count(),
            prisma.tenant.groupBy({
                by: ["plan"],
                _count: { plan: true },
            }),
        ]);

    const planBreakdown = { starter: 0, professional: 0, enterprise: 0 };
    for (const p of planCounts) {
        if (p.plan === "STARTER") planBreakdown.starter = p._count.plan;
        if (p.plan === "PROFESSIONAL") planBreakdown.professional = p._count.plan;
        if (p.plan === "ENTERPRISE") planBreakdown.enterprise = p._count.plan;
    }

    return {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalEmployees,
        totalMonthlyPayroll: 0,
        totalPayrollRuns,
        planBreakdown,
    };
}

// ─── Tenant Mutations ────────────────────────────────────

export async function updateTenantStatus(
    id: string,
    status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
) {
    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { status: status as TenantStatus },
        });

        await logAction(
            `TENANT_${status}`,
            tenant.name,
            "system",
            "Super Admin",
            id,
            { status }
        );

        revalidatePath("/admin");
        revalidatePath("/admin/tenants");
        revalidatePath(`/admin/tenants/${id}`);
        return { success: true };
    } catch {
        return { error: "Tenant not found" };
    }
}

export async function updateTenantPlan(
    id: string,
    plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
) {
    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                plan: plan as Plan,
                maxEmployees: MAX_EMPLOYEES[plan as Plan],
            },
        });

        await logAction(
            "PLAN_CHANGED",
            `${tenant.name} → ${plan}`,
            "system",
            "Super Admin",
            id,
            { plan }
        );

        revalidatePath("/admin");
        revalidatePath("/admin/tenants");
        revalidatePath(`/admin/tenants/${id}`);
        return { success: true };
    } catch {
        return { error: "Tenant not found" };
    }
}

export async function createTenant(data: {
    name: string;
    slug: string;
    country: string;
    plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    ownerName: string;
    ownerEmail: string;
}) {
    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) return { error: "A tenant with this slug already exists" };

    const [firstName, ...rest] = data.ownerName.split(" ");
    const lastName = rest.join(" ") || firstName;

    const tenant = await prisma.tenant.create({
        data: {
            name: data.name,
            slug: data.slug,
            country: data.country,
            plan: data.plan as Plan,
            maxEmployees: MAX_EMPLOYEES[data.plan as Plan],
            employees: {
                create: {
                    employeeId: "SH-0001",
                    firstName,
                    lastName,
                    email: data.ownerEmail,
                    role: "OWNER",
                    basicSalary: 0,
                    startDate: new Date(),
                    passwordHash: await bcrypt.hash("changeme123", 12),
                },
            },
        },
    });

    await logAction(
        "TENANT_CREATED",
        data.name,
        "system",
        "Super Admin",
        tenant.id,
        { slug: data.slug, plan: data.plan }
    );

    revalidatePath("/admin");
    revalidatePath("/admin/tenants");
    return { success: true, tenant };
}

// ─── Admin User Queries ──────────────────────────────────

export async function getAdmins() {
    return prisma.admin.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function createAdmin(data: {
    name: string;
    email: string;
    password: string;
    role: "SUPER_ADMIN" | "SUPPORT";
}) {
    const existing = await prisma.admin.findUnique({ where: { email: data.email } });
    if (existing) return { error: "An admin with this email already exists" };

    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.admin.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
        },
    });

    await logAction(
        "ADMIN_CREATED",
        data.email,
        "system",
        "Super Admin",
        undefined,
        { role: data.role }
    );

    revalidatePath("/admin/users");
    return { success: true };
}

// ─── Audit Log Queries ──────────────────────────────────

export async function getAuditLogs(limit = 50, actionFilter?: string) {
    const where: Record<string, unknown> = {};
    if (actionFilter && actionFilter !== "ALL") {
        where.action = { contains: actionFilter, mode: "insensitive" };
    }
    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

// ─── Delete Admin ────────────────────────────────────────

export async function deleteAdmin(id: string) {
    try {
        const admin = await prisma.admin.delete({ where: { id } });
        await logAction("ADMIN_DELETED", admin.email, "system", "Super Admin");
        revalidatePath("/admin/users");
        return { success: true };
    } catch {
        return { error: "Admin not found" };
    }
}

// ─── Delete Tenant (soft) ────────────────────────────────

export async function deleteTenant(id: string) {
    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { deletedAt: new Date(), status: "DEACTIVATED" },
        });

        await logAction("TENANT_DELETED", tenant.name, "system", "Super Admin", id);
        revalidatePath("/admin");
        revalidatePath("/admin/tenants");
        return { success: true };
    } catch {
        return { error: "Tenant not found" };
    }
}

// ─── Impersonation ───────────────────────────────────────

export async function generateImpersonationToken(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            employees: {
                where: { role: "OWNER" },
                select: { id: true, firstName: true, lastName: true, email: true, employeeId: true },
                take: 1,
            },
        },
    });

    if (!tenant || !tenant.employees[0]) return { error: "No owner found for this tenant" };

    const owner = tenant.employees[0];
    const token = await new SignJWT({
        type: "impersonation",
        tenantId,
        employeeId: owner.id,
        ownerId: owner.employeeId,
        ownerEmail: owner.email,
        ownerName: `${owner.firstName} ${owner.lastName}`,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("5m")
        .sign(impersonationSecret);

    await logAction(
        "TENANT_IMPERSONATED",
        tenant.name,
        "system",
        "Super Admin",
        tenantId
    );

    return { token };
}

export async function verifyImpersonationToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, impersonationSecret);
        if (payload.type !== "impersonation") return null;
        return payload as {
            type: string;
            tenantId: string;
            employeeId: string;
            ownerId: string;
            ownerEmail: string;
            ownerName: string;
        };
    } catch {
        return null;
    }
}

// ─── Platform Settings ───────────────────────────────────

export async function getSettings() {
    const rows = await prisma.platformSetting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
}

export async function updateSettings(settings: Record<string, string>) {
    const ops = Object.entries(settings).map(([key, value]) =>
        prisma.platformSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        })
    );
    await Promise.all(ops);

    await logAction("SETTINGS_UPDATED", "Platform settings changed", "system", "Super Admin", undefined, settings);
    revalidatePath("/admin/settings");
    return { success: true };
}

// ─── Announcements ───────────────────────────────────────

export async function getAnnouncements() {
    return prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getActiveAnnouncements() {
    return prisma.announcement.findMany({
        where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createAnnouncement(data: {
    title: string;
    content: string;
    type: string;
    expiresAt?: string;
}) {
    const announcement = await prisma.announcement.create({
        data: {
            title: data.title,
            content: data.content,
            type: data.type as AnnouncementType,
            createdBy: "Super Admin",
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
    });

    await logAction("ANNOUNCEMENT_CREATED", data.title, "system", "Super Admin", announcement.id);
    revalidatePath("/admin/announcements");
    return { success: true };
}

export async function toggleAnnouncement(id: string) {
    const current = await prisma.announcement.findUnique({ where: { id } });
    if (!current) return { error: "Announcement not found" };

    await prisma.announcement.update({
        where: { id },
        data: { isActive: !current.isActive },
    });

    revalidatePath("/admin/announcements");
    return { success: true };
}

export async function deleteAnnouncement(id: string) {
    try {
        await prisma.announcement.delete({ where: { id } });
        revalidatePath("/admin/announcements");
        return { success: true };
    } catch {
        return { error: "Announcement not found" };
    }
}

// ─── Billing & Invoices ──────────────────────────────────

export async function getBillingOverview() {
    const tenants = await prisma.tenant.findMany({
        where: { deletedAt: null, status: "ACTIVE" },
        select: { id: true, name: true, plan: true, credits: true, discount: true },
    });

    const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { tenant: { select: { name: true } } },
    });

    // Calculate MRR
    let mrr = 0;
    for (const t of tenants) {
        const price = PLAN_PRICE[t.plan];
        const disc = Number(t.discount);
        mrr += price * (1 - disc / 100);
    }

    const paidCount = await prisma.invoice.count({ where: { status: "PAID" } });
    const overdueCount = await prisma.invoice.count({ where: { status: "OVERDUE" } });
    const pendingCount = await prisma.invoice.count({ where: { status: "PENDING" } });

    return { mrr, arr: mrr * 12, tenants, invoices, paidCount, overdueCount, pendingCount };
}

export async function createInvoice(data: {
    tenantId: string;
    amount: number;
    period: string;
    dueDate: string;
    description?: string;
}) {
    await prisma.invoice.create({
        data: {
            tenantId: data.tenantId,
            amount: data.amount,
            period: data.period,
            dueDate: new Date(data.dueDate),
            description: data.description,
        },
    });

    revalidatePath("/admin/billing");
    return { success: true };
}

export async function updateInvoiceStatus(id: string, status: string) {
    await prisma.invoice.update({
        where: { id },
        data: {
            status: status as InvoiceStatus,
            paidAt: status === "PAID" ? new Date() : undefined,
        },
    });
    revalidatePath("/admin/billing");
    return { success: true };
}

export async function updateTenantBilling(tenantId: string, data: { discount?: number; credits?: number; billingEmail?: string }) {
    await prisma.tenant.update({
        where: { id: tenantId },
        data: {
            discount: data.discount,
            credits: data.credits,
            billingEmail: data.billingEmail,
        },
    });
    revalidatePath("/admin/billing");
    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}

// ─── Platform Analytics ──────────────────────────────────

export async function getPlatformAnalytics() {
    // Tenant growth: count per month for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const tenants = await prisma.tenant.findMany({
        where: { createdAt: { gte: twelveMonthsAgo }, deletedAt: null },
        select: { createdAt: true, plan: true },
        orderBy: { createdAt: "asc" },
    });

    const employees = await prisma.employee.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    // Group by month
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const tenantGrowth = months.map((m) => {
        const count = tenants.filter((t) => {
            const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
            return key === m;
        }).length;
        return { month: m, tenants: count };
    });

    const employeeGrowth = months.map((m) => {
        const count = employees.filter((e) => {
            const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
            return key === m;
        }).length;
        return { month: m, employees: count };
    });

    // Revenue by plan
    const planCounts = await prisma.tenant.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE", deletedAt: null },
        _count: { plan: true },
    });

    const revenueByPlan = planCounts.map((p) => ({
        plan: p.plan,
        revenue: p._count.plan * PLAN_PRICE[p.plan],
        count: p._count.plan,
    }));

    // Status distribution
    const statusCounts = await prisma.tenant.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { status: true },
    });

    const statusDistribution = statusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
    }));

    return { tenantGrowth, employeeGrowth, revenueByPlan, statusDistribution };
}

// ─── Tenant Operational Data ─────────────────────────────

export async function getTenantEmployees(tenantId: string) {
    const employees = await prisma.employee.findMany({
        where: { tenantId },
        select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            role: true,
            status: true,
            basicSalary: true,
            startDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return employees.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        department: e.department || "—",
        role: e.role,
        status: e.status,
        basicSalary: Number(e.basicSalary),
        startDate: e.startDate.toISOString(),
    }));
}

export async function getTenantLeaveRequests(tenantId: string) {
    const leaves = await prisma.leaveRequest.findMany({
        where: { employee: { tenantId } },
        include: {
            employee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return leaves.map((l) => ({
        id: l.id,
        employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
        type: l.type,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
        status: l.status,
        reason: l.reason,
        createdAt: l.createdAt.toISOString(),
    }));
}

export async function getTenantOvertimeEntries(tenantId: string) {
    const entries = await prisma.overtimeEntry.findMany({
        where: { employee: { tenantId } },
        include: {
            employee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
        take: 20,
    });

    return entries.map((o) => ({
        id: o.id,
        employeeName: `${o.employee.firstName} ${o.employee.lastName}`,
        date: o.date.toISOString(),
        hours: Number(o.overtimeHours),
        rate: Number(o.rate),
        amount: Number(o.amount),
        status: o.status,
        reason: o.notes,
    }));
}

// ─── Tenant Analytics (detail) ───────────────────────────

export async function getTenantAnalytics(tenantId: string) {
    const payrollRuns = await prisma.payrollRun.findMany({
        where: { tenantId },
        select: { period: true, totalGross: true, totalNet: true, totalTax: true, employeeCount: true, status: true },
        orderBy: { period: "asc" },
    });

    const employeesByDept = await prisma.employee.groupBy({
        by: ["department"],
        where: { tenantId, status: "ACTIVE" },
        _count: { department: true },
    });

    const employeesByStatus = await prisma.employee.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { status: true },
    });

    return {
        payrollHistory: payrollRuns.map((r) => ({
            period: r.period,
            gross: Number(r.totalGross),
            net: Number(r.totalNet),
            tax: Number(r.totalTax),
            employees: r.employeeCount,
            status: r.status,
        })),
        employeesByDept: employeesByDept.map((d) => ({
            department: d.department || "Unassigned",
            count: d._count.department,
        })),
        employeesByStatus: employeesByStatus.map((s) => ({
            status: s.status,
            count: s._count.status,
        })),
    };
}

// ─── Tenant Feature Flags ────────────────────────────────

export async function getAvailableFeatures() {
    return [
        { key: "mobile_app", label: "Mobile App", description: "Native mobile app access for employees (GPS clock-in, payslip view)" },
        { key: "api_access", label: "API Access", description: "REST API access for third-party integrations" },
        { key: "custom_reports", label: "Custom Reports", description: "Advanced reporting and analytics dashboards" },
        { key: "bulk_payments", label: "Bulk Payments", description: "Bank integration for bulk salary disbursement" },
        { key: "multi_currency", label: "Multi-Currency", description: "Support for multiple currencies in payroll" },
        { key: "sso", label: "Single Sign-On (SSO)", description: "SAML/OIDC single sign-on for enterprise" },
        { key: "audit_trail", label: "Audit Trail", description: "Detailed audit logging of all tenant actions" },
        { key: "leave_management", label: "Leave Management", description: "Employee leave requests and approvals" },
        { key: "overtime_tracking", label: "Overtime Tracking", description: "Clock-in/out overtime with photo verification" },
        { key: "email_payslips", label: "Email Payslips", description: "Automatic payslip delivery via email" },
    ];
}

export async function getTenantFeatures(tenantId: string) {
    const features = await prisma.tenantFeature.findMany({
        where: { tenantId },
    });

    const featureMap: Record<string, { enabled: boolean; enabledAt: string | null; enabledBy: string | null }> = {};
    for (const f of features) {
        featureMap[f.feature] = {
            enabled: f.enabled,
            enabledAt: f.enabledAt?.toISOString() ?? null,
            enabledBy: f.enabledBy,
        };
    }
    return featureMap;
}

export async function toggleTenantFeature(tenantId: string, feature: string, enabled: boolean) {
    await prisma.tenantFeature.upsert({
        where: { tenantId_feature: { tenantId, feature } },
        update: {
            enabled,
            enabledAt: enabled ? new Date() : null,
            enabledBy: enabled ? "Super Admin" : null,
        },
        create: {
            tenantId,
            feature,
            enabled,
            enabledAt: enabled ? new Date() : null,
            enabledBy: enabled ? "Super Admin" : null,
        },
    });

    await logAction(
        enabled ? "FEATURE_ENABLED" : "FEATURE_DISABLED",
        `${feature} for tenant ${tenantId}`,
        "system",
        "Super Admin",
        tenantId,
        { feature, enabled }
    );

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}
