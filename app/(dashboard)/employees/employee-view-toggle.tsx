"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutGrid, List, Mail, Phone, Building2 } from "lucide-react";

type Employee = {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    department: string | null;
    jobTitle: string | null;
    role: string;
    basicSalary: number;
    status: string;
};

const statusColors: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success",
    ON_LEAVE: "bg-warning/10 text-warning",
    SUSPENDED: "bg-destructive/10 text-destructive",
    TERMINATED: "bg-muted text-muted-foreground",
};

const roleColors: Record<string, string> = {
    OWNER: "bg-primary/10 text-primary",
    PAYROLL_ADMIN: "bg-info/10 text-info",
    HR_MANAGER: "bg-warning/10 text-warning",
    SUPERVISOR: "bg-accent text-accent-foreground",
    EMPLOYEE: "bg-muted text-muted-foreground",
};

export function EmployeeViewToggle({
    children,
    employees,
}: {
    children: React.ReactNode;
    employees: Employee[];
}) {
    const [view, setView] = useState<"table" | "card">("table");

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-1">
                <Button
                    size="sm"
                    variant={view === "table" ? "default" : "outline"}
                    onClick={() => setView("table")}
                >
                    <List className="size-4" />
                </Button>
                <Button
                    size="sm"
                    variant={view === "card" ? "default" : "outline"}
                    onClick={() => setView("card")}
                >
                    <LayoutGrid className="size-4" />
                </Button>
            </div>

            {view === "table" ? (
                children
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {employees.map((emp) => (
                        <Link key={emp.id} href={`/employees/${emp.id}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="size-12">
                                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold truncate">
                                                    {emp.firstName} {emp.lastName}
                                                </h3>
                                                <Badge variant="secondary" className={`${statusColors[emp.status]} text-[10px] px-1.5`}>
                                                    {emp.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{emp.jobTitle || emp.role.replace("_", " ")}</p>
                                            <Badge variant="secondary" className={`${roleColors[emp.role]} mt-1 text-[10px]`}>
                                                {emp.role.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-3" />
                                            <span className="truncate">{emp.email}</span>
                                        </div>
                                        {emp.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="size-3" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                        {emp.department && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="size-3" />
                                                <span>{emp.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
