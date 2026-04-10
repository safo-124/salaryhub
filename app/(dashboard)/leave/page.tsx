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
import { getLeaveRequests } from "@/lib/actions/leave";
import { getEmployees } from "@/lib/actions/employees";
import { LeaveActions } from "./leave-actions";
import { NewLeaveForm } from "./new-leave-form";

const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-destructive/10 text-destructive",
};

const typeColors: Record<string, string> = {
    ANNUAL: "bg-primary/10 text-primary",
    SICK: "bg-destructive/10 text-destructive",
    MATERNITY: "bg-info/10 text-info",
    PATERNITY: "bg-info/10 text-info",
    UNPAID: "bg-muted text-muted-foreground",
    COMPASSIONATE: "bg-accent text-accent-foreground",
};

export default async function LeavePage() {
    const [requests, employees] = await Promise.all([
        getLeaveRequests(),
        getEmployees(),
    ]);
    const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Leave Management
                    </h1>
                    <p className="text-muted-foreground">
                        Track and manage employee leave requests.
                    </p>
                </div>
                <NewLeaveForm employees={activeEmployees} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                    <CardDescription>
                        {requests.length === 0
                            ? "No leave requests yet."
                            : `${requests.length} request${requests.length !== 1 ? "s" : ""} total.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No leave requests submitted yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.employeeName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {req.employeeCode}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={typeColors[req.type] || ""}
                                            >
                                                {req.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{req.startDate}</TableCell>
                                        <TableCell>{req.endDate}</TableCell>
                                        <TableCell>{req.days}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[req.status] || ""}
                                            >
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <LeaveActions id={req.id} status={req.status} />
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
