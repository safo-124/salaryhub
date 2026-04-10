"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    LogOut,
    ChevronUp,
    Shield,
    Activity,
    BarChart3,
    CreditCard,
    Megaphone,
    Sun,
    Moon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Tenants", href: "/admin/tenants", icon: Building2 },
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "Billing", href: "/admin/billing", icon: CreditCard },
    { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { title: "Platform Users", href: "/admin/users", icon: Users },
    { title: "Activity Log", href: "/admin/activity", icon: Activity },
    { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                                <Shield className="size-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-semibold">SalaryHub</span>
                                <span className="text-xs text-muted-foreground">
                                    Super Admin
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    item.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(item.href);
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            render={<Link href={item.href} />}
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <item.icon className="size-4" />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent"
                                    />
                                }
                            >
                                <Avatar className="size-8">
                                    <AvatarFallback className="bg-destructive/10 text-destructive text-xs">
                                        SA
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-0.5 leading-none text-left">
                                    <span className="text-sm font-medium">
                                        {session?.user?.name || "Super Admin"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        SUPER_ADMIN
                                    </span>
                                </div>
                                <ChevronUp className="ml-auto size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width]"
                                side="top"
                                align="start"
                            >
                                <DropdownMenuItem
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                >
                                    {theme === "dark" ? (
                                        <Sun className="mr-2 size-4" />
                                    ) : (
                                        <Moon className="mr-2 size-4" />
                                    )}
                                    {theme === "dark" ? "Light mode" : "Dark mode"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
