import { getPlatformStats, getTenants } from "@/lib/actions/admin";
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, TrendingUp, Plus } from "lucide-react";

function formatGHS(amount: number) {
    return `GHS ${amount.toLocaleString("en-GH")}`;
}

function statusBadge(status: string) {
    switch (status) {
        case "ACTIVE":
            return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>;
        case "SUSPENDED":
            return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Suspended</Badge>;
        case "DEACTIVATED":
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Deactivated</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

function planBadge(plan: string) {
    switch (plan) {
        case "STARTER":
            return <Badge variant="secondary">Starter</Badge>;
        case "PROFESSIONAL":
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Professional</Badge>;
        case "ENTERPRISE":
            return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Enterprise</Badge>;
        default:
            return <Badge variant="secondary">{plan}</Badge>;
    }
}

export default async function AdminDashboardPage() {
    const [stats, tenants] = await Promise.all([
        getPlatformStats(),
        getTenants(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Platform Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Overview of all SalaryHub tenants and platform metrics.
                    </p>
                </div>
                <Button render={<Link href="/admin/tenants/new" />}>
                    <Plus className="mr-2 size-4" />
                    Add Tenant
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                        <Building2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTenants}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeTenants} active, {stats.suspendedTenants} suspended
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Employees
                        </CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalEmployees.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all tenants
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Monthly Payroll
                        </CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatGHS(stats.totalMonthlyPayroll)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active tenants combined
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Payroll Runs
                        </CardTitle>
                        <TrendingUp className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPayrollRuns}</div>
                        <p className="text-xs text-muted-foreground">
                            All-time across platform
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Starter Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.planBreakdown.starter}</div>
                        <p className="text-xs text-muted-foreground">≤ 25 employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Professional Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.planBreakdown.professional}</div>
                        <p className="text-xs text-muted-foreground">≤ 100 employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Enterprise Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.planBreakdown.enterprise}</div>
                        <p className="text-xs text-muted-foreground">≤ 500 employees</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Tenants</CardTitle>
                    <CardDescription>
                        Manage organizations using the SalaryHub platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Monthly Payroll</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{tenant.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tenant.slug}.salaryhub.com
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm">{tenant.ownerName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tenant.ownerEmail}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{planBadge(tenant.plan)}</TableCell>
                                    <TableCell>
                                        {tenant.employeeCount} / {tenant.maxEmployees}
                                    </TableCell>
                                    <TableCell>
                                        {tenant.monthlyPayroll > 0
                                            ? formatGHS(tenant.monthlyPayroll)
                                            : "—"}
                                    </TableCell>
                                    <TableCell>{statusBadge(tenant.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            render={<Link href={`/admin/tenants/${tenant.id}`} />}
                                        >
                                            View
                                        </Button>
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
