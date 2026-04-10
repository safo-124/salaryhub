import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Users, Search } from "lucide-react";
import { getEmployees } from "@/lib/actions/employees";
import { EmployeeSearch } from "./employee-search";

const roleColors: Record<string, string> = {
    OWNER: "bg-primary/10 text-primary",
    PAYROLL_ADMIN: "bg-info/10 text-info",
    HR_MANAGER: "bg-warning/10 text-warning",
    SUPERVISOR: "bg-accent text-accent-foreground",
    EMPLOYEE: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success",
    ON_LEAVE: "bg-warning/10 text-warning",
    SUSPENDED: "bg-destructive/10 text-destructive",
    TERMINATED: "bg-muted text-muted-foreground",
};

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const { q, status } = await searchParams;
    const allEmployees = await getEmployees();

    // Client-side filtering based on search params
    let employees = allEmployees;
    if (q) {
        const query = q.toLowerCase();
        employees = employees.filter(
            (e) =>
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(query) ||
                e.email.toLowerCase().includes(query) ||
                e.employeeId.toLowerCase().includes(query) ||
                (e.department && e.department.toLowerCase().includes(query))
        );
    }
    if (status && status !== "ALL") {
        employees = employees.filter((e) => e.status === status);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their details.
                    </p>
                </div>
                <Button render={<Link href="/employees/new" />}>
                    <Plus className="mr-2 size-4" />
                    Add Employee
                </Button>
            </div>

            <EmployeeSearch currentQuery={q} currentStatus={status} />

            <Card>
                <CardHeader>
                    <CardTitle>
                        {q || status ? "Filtered Results" : "All Employees"}
                    </CardTitle>
                    <CardDescription>
                        {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                        {q || status ? "found" : "total"}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="mb-4 size-12 text-muted-foreground/50" />
                            {q || status ? (
                                <>
                                    <h3 className="text-lg font-medium">No employees match your search</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Try adjusting your search or filters.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium">No employees yet</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Get started by adding your first team member.
                                    </p>
                                    <Button className="mt-4" render={<Link href="/employees/new" />}>
                                        <Plus className="mr-2 size-4" />
                                        Add First Employee
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Basic Salary</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-mono text-sm">
                                            {emp.employeeId}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/employees/${emp.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {emp.firstName} {emp.lastName}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                {emp.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>{emp.department || "—"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={roleColors[emp.role] || ""}
                                            >
                                                {emp.role.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[emp.status] || ""}
                                            >
                                                {emp.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            GHS {emp.basicSalary.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
