import { getPlatformAnalytics, getPlatformStats } from "@/lib/actions/admin";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";
import { AnalyticsCharts } from "./charts";

export default async function PlatformAnalyticsPage() {
    const [analytics, stats] = await Promise.all([
        getPlatformAnalytics(),
        getPlatformStats(),
    ]);

    const mrr =
        stats.planBreakdown.starter * 99 +
        stats.planBreakdown.professional * 299 +
        stats.planBreakdown.enterprise * 799;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Platform Analytics
                </h1>
                <p className="text-muted-foreground">
                    Growth metrics, revenue breakdown, and tenant insights.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                        <Building2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTenants}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeTenants} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEmployees.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all tenants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">GHS {mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payroll Runs</CardTitle>
                        <TrendingUp className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPayrollRuns}</div>
                        <p className="text-xs text-muted-foreground">All-time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <AnalyticsCharts
                tenantGrowth={analytics.tenantGrowth}
                employeeGrowth={analytics.employeeGrowth}
                revenueByPlan={analytics.revenueByPlan}
                statusDistribution={analytics.statusDistribution}
            />
        </div>
    );
}
