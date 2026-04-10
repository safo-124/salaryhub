import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import LoginForm from "./login-form";

export default async function LoginPage() {
    const headerList = await headers();
    const host = headerList.get("host") ?? "";

    // Extract subdomain: "techstart.localhost:3000" → "techstart"
    const hostWithoutPort = host.split(":")[0];
    const parts = hostWithoutPort.split(".");
    // subdomain exists if there are more parts than just "localhost" or "domain.com"
    const subdomain =
        parts.length > 1 && parts[0] !== "www" ? parts[0] : null;

    let tenantName: string | null = null;

    if (subdomain) {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: subdomain },
            select: { name: true, status: true },
        });
        if (tenant?.status === "ACTIVE") {
            tenantName = tenant.name;
        }
    }

    return <LoginForm tenantName={tenantName} />;
}
