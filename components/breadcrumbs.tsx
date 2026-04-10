"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
    employees: "Employees",
    payroll: "Payroll",
    payslips: "Payslips",
    leave: "Leave",
    overtime: "Overtime",
    settings: "Settings",
    new: "New",
    edit: "Edit",
    run: "Run Payroll",
};

export function Breadcrumbs() {
    const pathname = usePathname();
    if (pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];

    let currentPath = "";
    for (const segment of segments) {
        currentPath += `/${segment}`;
        const label = routeLabels[segment] || (segment.startsWith("c") && segment.length > 10 ? "Details" : segment);
        crumbs.push({ label, href: currentPath });
    }

    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
                <Home className="size-3.5" />
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight className="size-3.5" />
                    {i === crumbs.length - 1 ? (
                        <span className="font-medium text-foreground">{crumb.label}</span>
                    ) : (
                        <Link href={crumb.href} className="hover:text-foreground transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
