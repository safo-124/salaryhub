import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarPermissions } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getUserPermissions } from "@/lib/actions/permissions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let permissions: SidebarPermissions | undefined;
    try {
        const p = await getUserPermissions();
        permissions = {
            canManageEmployees: p.canManageEmployees,
            canRunPayroll: p.canRunPayroll,
            canApproveLeave: p.canApproveLeave,
            canApproveOvertime: p.canApproveOvertime,
            canManageSettings: p.canManageSettings,
            canExport: p.canExport,
            isEmployee: p.isEmployee,
        };
    } catch {
        // Not logged in or no tenant session — show default nav
    }

    return (
        <SessionProvider>
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar permissions={permissions} />
                    <SidebarInset>
                        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumbs />
                        </header>
                        <main className="flex-1 p-6">{children}</main>
                        <ImpersonationBanner />
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </SessionProvider>
    );
}
