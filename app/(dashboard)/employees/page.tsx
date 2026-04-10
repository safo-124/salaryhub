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
import { Plus } from "lucide-react";
import { getEmployees } from "@/lib/actions/employees";

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

export default async function EmployeesPage() {
    const employees = await getEmployees();

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

            <Card>
                <CardHeader>
                    <CardTitle>All Employees</CardTitle>
                    <CardDescription>
                        {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                        total.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
}
