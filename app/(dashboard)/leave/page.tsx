import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getLeaveRequests } from "@/lib/actions/leave";
import { getEmployees } from "@/lib/actions/employees";
import { getLeaveBalances } from "@/lib/actions/leave-balances";
import { NewLeaveForm } from "./new-leave-form";
import { LeaveTable } from "./leave-table";
import { LeaveCalendar } from "./leave-calendar";
import { LeaveBalanceTable } from "./leave-balance-table";
import { ExportButton } from "@/components/export-button";
import { exportLeaveCSV } from "@/lib/actions/export";

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
    const [requests, employees, balances] = await Promise.all([
        getLeaveRequests(),
        getEmployees(),
        getLeaveBalances(),
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
                <div className="flex gap-2">
                    <ExportButton exportFn={exportLeaveCSV} filename="leave-requests.csv" label="Export" />
                    <NewLeaveForm employees={activeEmployees} />
                </div>
            </div>

            {requests.length > 0 && <LeaveCalendar requests={requests} />}

            {balances.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Balances</CardTitle>
                        <CardDescription>
                            Entitlements and remaining days for {new Date().getFullYear()}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaveBalanceTable balances={balances} />
                    </CardContent>
                </Card>
            )}

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
                        <LeaveTable requests={requests} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
