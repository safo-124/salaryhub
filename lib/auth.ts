import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod/v4";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyImpersonationToken } from "@/lib/actions/admin";

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = (user as { role: string }).role;
                token.tenantId = (user as { tenantId?: string }).tenantId || "";
                token.employeeId = (user as { employeeId?: string }).employeeId || "";
                token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin || false;
                token.impersonating = (user as { impersonating?: boolean }).impersonating || false;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;
            session.user.tenantId = token.tenantId as string;
            session.user.employeeId = token.employeeId as string;
            session.user.isSuperAdmin = token.isSuperAdmin as boolean;
            session.user.impersonating = token.impersonating as boolean;
            return session;
        },
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                impersonationToken: { label: "Impersonation Token", type: "text" },
            },
            async authorize(credentials) {
                // ── Impersonation Flow ──────────────────
                const impToken = (credentials as Record<string, string>)?.impersonationToken;
                if (impToken) {
                    const payload = await verifyImpersonationToken(impToken);
                    if (!payload) return null;

                    return {
                        id: payload.employeeId,
                        name: payload.ownerName,
                        email: payload.ownerEmail,
                        role: "OWNER",
                        tenantId: payload.tenantId,
                        employeeId: payload.ownerId,
                        impersonating: true,
                    };
                }

                // ── Normal Login Flow ───────────────────
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                // 1. Check super admin / support accounts
                const admin = await prisma.admin.findUnique({ where: { email } });
                if (admin) {
                    const valid = await bcrypt.compare(password, admin.passwordHash);
                    if (!valid) return null;

                    await prisma.admin.update({
                        where: { id: admin.id },
                        data: { lastLoginAt: new Date() },
                    });

                    return {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        isSuperAdmin: admin.role === "SUPER_ADMIN",
                    };
                }

                // 2. Check tenant employee accounts
                const employee = await prisma.employee.findFirst({
                    where: { email, passwordHash: { not: null } },
                    include: { tenant: { select: { id: true, status: true } } },
                });

                if (!employee || !employee.passwordHash) return null;
                if (employee.tenant.status !== "ACTIVE") return null;

                const validPw = await bcrypt.compare(password, employee.passwordHash);
                if (!validPw) return null;

                return {
                    id: employee.id,
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.email,
                    role: employee.role,
                    tenantId: employee.tenantId,
                    employeeId: employee.employeeId,
                };
            },
        }),
    ],
});
