import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, DollarSign, Clock, CalendarDays, Plus, Play, FileText, ArrowRight } from "lucide-react";
import { getDashboardStats, getRecentPayrollRuns, getPayrollChartData, getLeaveStats } from "@/lib/actions/dashboard";
import { PayrollChart, LeaveTypeChart } from "./dashboard-charts";

const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PROCESSING: "bg-info/10 text-info",
    PENDING_APPROVAL: "bg-warning/10 text-warning",
    APPROVED: "bg-primary/10 text-primary",
    PAID: "bg-success/10 text-success",
};

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
    const [stats, recentRuns, chartData, leaveStats] = await Promise.all([
        getDashboardStats(),
        getRecentPayrollRuns(),
        getPayrollChartData(),
        getLeaveStats(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your payroll operations.
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Payroll
                        </CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">
                            {fmtGHS(stats.totalPayroll)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.lastPeriod ?? "No payroll yet"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Employees</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">
                            {stats.employeeCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Active employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Approvals
                        </CardTitle>
                        <Clock className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">
                            {stats.pendingApprovals}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Last Period
                        </CardTitle>
                        <CalendarDays className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.lastPeriod ?? "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">Most recent payroll</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/payroll/run" />}>
                    <Play className="size-5 text-primary" />
                    <div className="text-left">
                        <p className="font-medium">Run Payroll</p>
                        <p className="text-xs text-muted-foreground">Process monthly salaries</p>
                    </div>
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/employees/new" />}>
                    <Plus className="size-5 text-primary" />
                    <div className="text-left">
                        <p className="font-medium">Add Employee</p>
                        <p className="text-xs text-muted-foreground">Onboard a new team member</p>
                    </div>
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/leave" />}>
                    <CalendarDays className="size-5 text-primary" />
                    <div className="text-left">
                        <p className="font-medium">Leave Requests</p>
                        <p className="text-xs text-muted-foreground">Review pending requests</p>
                    </div>
                </Button>
                <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/payslips" />}>
                    <FileText className="size-5 text-primary" />
                    <div className="text-left">
                        <p className="font-medium">View Payslips</p>
                        <p className="text-xs text-muted-foreground">Browse generated payslips</p>
                    </div>
                </Button>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <PayrollChart data={chartData} />
                <LeaveTypeChart data={leaveStats.byType} />
            </div>

            {/* Recent Payroll Runs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Payroll Runs</CardTitle>
                    <CardDescription>
                        History of your recent payroll processing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentRuns.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No payroll runs yet. Go to Payroll to run your first payroll.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead className="text-right">Net Pay</TableHead>
                                    <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRuns.map((run) => (
                                    <TableRow key={run.id}>
                                        <TableCell>
                                            <Link href={`/payroll/${run.id}`} className="font-medium hover:underline">
                                                {run.period}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[run.status]}
                                            >
                                                {run.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{run.employeeCount}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {fmtGHS(run.totalNet)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {run.processedAt
                                                ? new Date(run.processedAt).toLocaleDateString()
                                                : "—"}
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
