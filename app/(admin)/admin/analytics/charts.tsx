"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    TenantGrowthChart,
    EmployeeGrowthChart,
    RevenueByPlanChart,
    StatusDistributionChart,
} from "@/components/admin-charts";

interface AnalyticsChartsProps {
    tenantGrowth: { month: string; tenants: number }[];
    employeeGrowth: { month: string; employees: number }[];
    revenueByPlan: { plan: string; revenue: number; count: number }[];
    statusDistribution: { status: string; count: number }[];
}

export function AnalyticsCharts({
    tenantGrowth,
    employeeGrowth,
    revenueByPlan,
    statusDistribution,
}: AnalyticsChartsProps) {
    return (
        <>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Growth</CardTitle>
                        <CardDescription>New tenants per month (last 12 months)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tenantGrowth.length > 0 ? (
                            <TenantGrowthChart data={tenantGrowth} />
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No data available yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee Growth</CardTitle>
                        <CardDescription>New employees per month (last 12 months)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employeeGrowth.length > 0 ? (
                            <EmployeeGrowthChart data={employeeGrowth} />
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No data available yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Plan</CardTitle>
                        <CardDescription>Monthly revenue breakdown by subscription tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueByPlan.length > 0 ? (
                            <RevenueByPlanChart data={revenueByPlan} />
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No active tenants yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Status Distribution</CardTitle>
                        <CardDescription>Active, suspended, and deactivated tenants</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statusDistribution.length > 0 ? (
                            <StatusDistributionChart data={statusDistribution} />
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No tenants yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
