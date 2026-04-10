"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    DollarSign,
    FileText,
    Settings,
    LogOut,
    ChevronUp,
    Sun,
    Moon,
    CalendarDays,
    Clock,
    Bell,
    ClipboardList,
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
import { User } from "lucide-react";

export type SidebarPermissions = {
    canManageEmployees: boolean;
    canRunPayroll: boolean;
    canApproveLeave: boolean;
    canApproveOvertime: boolean;
    canManageSettings: boolean;
    canExport: boolean;
    isEmployee: boolean;
};

const allNavItems = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard, minRole: null },
    { title: "My Profile", href: "/profile", icon: User, employeeOnly: true },
    { title: "Employees", href: "/employees", icon: Users, permission: "canManageEmployees" as const },
    { title: "Payroll", href: "/payroll", icon: DollarSign, permission: "canRunPayroll" as const },
    { title: "Payslips", href: "/payslips", icon: FileText, minRole: null },
    { title: "Leave", href: "/leave", icon: CalendarDays, minRole: null },
    { title: "Overtime", href: "/overtime", icon: Clock, minRole: null },
    { title: "Notifications", href: "/notifications", icon: Bell, minRole: null },
    { title: "Audit Log", href: "/audit", icon: ClipboardList, permission: "canManageEmployees" as const },
];

function getVisibleNavItems(permissions?: SidebarPermissions) {
    if (!permissions) return allNavItems.filter((i) => !i.employeeOnly);
    return allNavItems.filter((item) => {
        if (item.employeeOnly) return permissions.isEmployee;
        if (item.permission) return permissions[item.permission];
        return true;
    });
}

export function AppSidebar({ permissions }: { permissions?: SidebarPermissions }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const navItems = getVisibleNavItems(permissions);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/" />}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <span className="text-sm font-bold">S</span>
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-semibold">SalaryHub</span>
                                <span className="text-xs text-muted-foreground">
                                    Payroll Platform
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    item.href === "/"
                                        ? pathname === "/"
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
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {session?.user?.name
                                            ?.split(" ")
                                            .map((n) => n[0])
                                            .join("") || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-0.5 leading-none text-left">
                                    <span className="text-sm font-medium">
                                        {session?.user?.name || "User"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {session?.user?.role || ""}
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
                                {(!permissions || permissions.canManageSettings) && (
                                    <DropdownMenuItem render={<Link href="/settings" />}>
                                        <Settings className="mr-2 size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                )}
                                {permissions?.isEmployee && (
                                    <DropdownMenuItem render={<Link href="/profile" />}>
                                        <User className="mr-2 size-4" />
                                        My Profile
                                    </DropdownMenuItem>
                                )}
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
