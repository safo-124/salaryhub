import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...\n");

    // ─── Super Admin ─────────────────────────────────────
    const superAdmin = await prisma.admin.upsert({
        where: { email: "super@salaryhub.com" },
        update: {},
        create: {
            email: "super@salaryhub.com",
            name: "Super Admin",
            passwordHash: await bcrypt.hash("super123", 12),
            role: "SUPER_ADMIN",
        },
    });
    console.log(`✅ Super Admin: ${superAdmin.email} (password: super123)`);

    // ─── Support Admin ───────────────────────────────────
    const supportAdmin = await prisma.admin.upsert({
        where: { email: "support@salaryhub.com" },
        update: {},
        create: {
            email: "support@salaryhub.com",
            name: "Support Agent",
            passwordHash: await bcrypt.hash("support123", 12),
            role: "SUPPORT",
        },
    });
    console.log(`✅ Support Admin: ${supportAdmin.email} (password: support123)`);

    // ─── Demo Tenant: Acme Corporation ───────────────────
    const acme = await prisma.tenant.upsert({
        where: { slug: "acme" },
        update: {},
        create: {
            name: "Acme Corporation",
            slug: "acme",
            country: "GH",
            plan: "PROFESSIONAL",
            maxEmployees: 100,
        },
    });

    // Owner for Acme
    const existingOwner = await prisma.employee.findFirst({
        where: { tenantId: acme.id, email: "kwame@acmecorp.com" },
    });
    if (!existingOwner) {
        await prisma.employee.create({
            data: {
                tenantId: acme.id,
                employeeId: "SH-0001",
                firstName: "Kwame",
                lastName: "Asante",
                email: "kwame@acmecorp.com",
                role: "OWNER",
                basicSalary: 15000,
                startDate: new Date("2025-06-15"),
                passwordHash: await bcrypt.hash("admin123", 12),
            },
        });
    }
    console.log(`✅ Tenant: ${acme.name} (owner: kwame@acmecorp.com / admin123)`);

    // ─── Demo Tenant: TechStart Ghana ────────────────────
    const techstart = await prisma.tenant.upsert({
        where: { slug: "techstart" },
        update: {},
        create: {
            name: "TechStart Ghana",
            slug: "techstart",
            country: "GH",
            plan: "STARTER",
            maxEmployees: 25,
        },
    });

    const existingOwner2 = await prisma.employee.findFirst({
        where: { tenantId: techstart.id, email: "ama@techstart.com" },
    });
    if (!existingOwner2) {
        await prisma.employee.create({
            data: {
                tenantId: techstart.id,
                employeeId: "SH-0001",
                firstName: "Ama",
                lastName: "Mensah",
                email: "ama@techstart.com",
                role: "OWNER",
                basicSalary: 12000,
                startDate: new Date("2025-09-01"),
                passwordHash: await bcrypt.hash("admin123", 12),
            },
        });
    }
    console.log(`✅ Tenant: ${techstart.name} (owner: ama@techstart.com / admin123)`);

    // ─── Seed audit log entry ────────────────────────────
    await prisma.auditLog.create({
        data: {
            action: "PLATFORM_SEEDED",
            target: "Database initialized with seed data",
            actorId: superAdmin.id,
            actorName: "Super Admin",
        },
    });
    console.log(`✅ Audit log seeded`);

    console.log("\n🎉 Seed complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
