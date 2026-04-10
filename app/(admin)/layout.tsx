import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <TooltipProvider>
                <SidebarProvider>
                    <AdminSidebar />
                    <SidebarInset>
                        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Badge variant="destructive" className="text-xs">
                                Super Admin
                            </Badge>
                        </header>
                        <main className="flex-1 p-6">{children}</main>
                        <ImpersonationBanner />
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </SessionProvider>
    );
}
