import { getTenant, getTenantAnalytics, getTenantFeatures, getAvailableFeatures, getTenantEmployees, getTenantLeaveRequests, getTenantOvertimeEntries } from "@/lib/actions/admin";
import { notFound } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, DollarSign, Calendar, CalendarDays, Clock } from "lucide-react";
import { TenantActions } from "./actions";
import { TenantFeatureToggles } from "./features";

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

function formatGHS(amount: number) {
    return `GHS ${amount.toLocaleString("en-GH")}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

export default async function TenantDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [tenant, analytics, features, availableFeatures, employees, leaveRequests, overtimeEntries] = await Promise.all([
        getTenant(id),
        getTenantAnalytics(id),
        getTenantFeatures(id),
        getAvailableFeatures(),
        getTenantEmployees(id),
        getTenantLeaveRequests(id),
        getTenantOvertimeEntries(id),
    ]);

    if (!tenant) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" render={<Link href="/admin/tenants" />}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                        {statusBadge(tenant.status)}
                        {planBadge(tenant.plan)}
                    </div>
                    <p className="text-muted-foreground">
                        {tenant.slug}.salaryhub.com
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Building2 className="size-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Country</p>
                            <p className="text-lg font-semibold">{tenant.country}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Users className="size-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Employees</p>
                            <p className="text-lg font-semibold">
                                {tenant.employeeCount} / {tenant.maxEmployees}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <DollarSign className="size-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Monthly Payroll</p>
                            <p className="text-lg font-semibold">
                                {tenant.monthlyPayroll > 0 ? formatGHS(tenant.monthlyPayroll) : "—"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Calendar className="size-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Payroll Runs</p>
                            <p className="text-lg font-semibold">{tenant.totalPayrollRuns}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Organization Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Core information about this tenant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 divide-y">
                        <DetailRow label="Organization Name" value={tenant.name} />
                        <DetailRow label="Subdomain" value={`${tenant.slug}.salaryhub.com`} />
                        <DetailRow label="Country" value={tenant.country} />
                        <DetailRow label="Plan" value={planBadge(tenant.plan)} />
                        <DetailRow label="Max Employees" value={tenant.maxEmployees} />
                        <DetailRow label="Status" value={statusBadge(tenant.status)} />
                        <DetailRow
                            label="Joined"
                            value={new Date(tenant.createdAt).toLocaleDateString("en-GH", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        />
                    </CardContent>
                </Card>

                {/* Owner Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Owner</CardTitle>
                        <CardDescription>Primary account holder for this organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 divide-y">
                        <DetailRow label="Name" value={tenant.ownerName} />
                        <DetailRow label="Email" value={tenant.ownerEmail} />
                    </CardContent>
                </Card>
            </div>

            {/* Tenant Analytics */}
            {analytics.payrollHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payroll History</CardTitle>
                        <CardDescription>Payroll runs for this organization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics.payrollHistory.map((r) => (
                                <div key={r.period} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{r.period}</p>
                                        <p className="text-xs text-muted-foreground">{r.employees} employees</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{formatGHS(r.gross)}</p>
                                        <p className="text-xs text-muted-foreground">Net: {formatGHS(r.net)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {analytics.employeesByDept.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Employees by Department</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.employeesByDept.map((d) => (
                                    <div key={d.department} className="flex items-center justify-between">
                                        <span className="text-sm">{d.department}</span>
                                        <span className="text-sm font-medium">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {analytics.employeesByStatus.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Employees by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.employeesByStatus.map((s) => (
                                    <div key={s.status} className="flex items-center justify-between">
                                        <span className="text-sm">{s.status}</span>
                                        <span className="text-sm font-medium">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Employee Roster */}
            <Card>
                <CardHeader>
                    <CardTitle>Employees ({employees.length})</CardTitle>
                    <CardDescription>Current roster for this organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No employees yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4">ID</th>
                                        <th className="pb-2 pr-4">Name</th>
                                        <th className="pb-2 pr-4">Email</th>
                                        <th className="pb-2 pr-4">Department</th>
                                        <th className="pb-2 pr-4">Role</th>
                                        <th className="pb-2 pr-4">Status</th>
                                        <th className="pb-2 text-right">Basic Salary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((e) => (
                                        <tr key={e.id} className="border-b last:border-0">
                                            <td className="py-2 pr-4 font-mono text-xs">{e.employeeId}</td>
                                            <td className="py-2 pr-4 font-medium">{e.name}</td>
                                            <td className="py-2 pr-4 text-muted-foreground">{e.email}</td>
                                            <td className="py-2 pr-4">{e.department}</td>
                                            <td className="py-2 pr-4">
                                                <Badge variant="secondary" className="text-xs">{e.role}</Badge>
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge className={
                                                    e.status === "ACTIVE"
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : e.status === "TERMINATED"
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                }>{e.status}</Badge>
                                            </td>
                                            <td className="py-2 text-right">{formatGHS(e.basicSalary)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Leave Requests & Overtime */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="size-5" />
                            Leave Requests ({leaveRequests.length})
                        </CardTitle>
                        <CardDescription>Recent leave requests from employees.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leaveRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No leave requests.</p>
                        ) : (
                            <div className="space-y-2">
                                {leaveRequests.map((l) => (
                                    <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{l.employeeName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {l.type} &middot; {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                                            </p>
                                            {l.reason && <p className="mt-1 text-xs text-muted-foreground">{l.reason}</p>}
                                        </div>
                                        <Badge className={
                                            l.status === "APPROVED"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : l.status === "REJECTED"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        }>{l.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="size-5" />
                            Overtime Entries ({overtimeEntries.length})
                        </CardTitle>
                        <CardDescription>Recent overtime logged by employees.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {overtimeEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No overtime entries.</p>
                        ) : (
                            <div className="space-y-2">
                                {overtimeEntries.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{o.employeeName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(o.date).toLocaleDateString()} &middot; {o.hours.toFixed(1)}h @ {o.rate}x
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatGHS(o.amount)}</p>
                                            <Badge className={
                                                o.status === "APPROVED"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : o.status === "REJECTED"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            }>{o.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Feature Flags */}
            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>
                        Enable or disable features for this organization. Tenants can request features and you activate them here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TenantFeatureToggles tenantId={tenant.id} features={features} availableFeatures={availableFeatures} />
                </CardContent>
            </Card>

            {/* Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Tenant Actions</CardTitle>
                    <CardDescription>
                        Manage this organization&apos;s status and plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TenantActions tenantId={tenant.id} currentStatus={tenant.status} currentPlan={tenant.plan} />
                </CardContent>
            </Card>
        </div>
    );
}
