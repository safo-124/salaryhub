import { getTenants } from "@/lib/actions/admin";
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

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

export default async function TenantsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const { search, status } = await searchParams;
    const tenants = await getTenants(search, status);

    const active = tenants.filter((t) => t.status === "ACTIVE").length;
    const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;
    const deactivated = tenants.filter((t) => t.status === "DEACTIVATED").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-muted-foreground">
                        Manage all organizations on the SalaryHub platform.
                    </p>
                </div>
                <Button render={<Link href="/admin/tenants/new" />}>
                    <Plus className="mr-2 size-4" />
                    Add Tenant
                </Button>
            </div>

            {/* Search & Filter */}
            <form className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        name="search"
                        placeholder="Search tenants..."
                        defaultValue={search}
                        className="pl-9"
                    />
                </div>
                <select
                    name="status"
                    defaultValue={status || "ALL"}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                </select>
                <Button type="submit" variant="secondary" size="sm">
                    Filter
                </Button>
            </form>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active</p>
                                <p className="text-2xl font-bold text-emerald-600">{active}</p>
                            </div>
                            <div className="size-3 rounded-full bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Suspended</p>
                                <p className="text-2xl font-bold text-amber-600">{suspended}</p>
                            </div>
                            <div className="size-3 rounded-full bg-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Deactivated</p>
                                <p className="text-2xl font-bold text-red-600">{deactivated}</p>
                            </div>
                            <div className="size-3 rounded-full bg-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Organizations</CardTitle>
                    <CardDescription>
                        {tenants.length} total organizations registered.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Subdomain</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Payroll Runs</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {tenant.slug}
                                        </code>
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
                                    <TableCell>{tenant.totalPayrollRuns}</TableCell>
                                    <TableCell>{statusBadge(tenant.status)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(tenant.createdAt).toLocaleDateString("en-GH", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            render={<Link href={`/admin/tenants/${tenant.id}`} />}
                                        >
                                            Manage
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
