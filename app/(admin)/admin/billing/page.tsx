import { getBillingOverview } from "@/lib/actions/admin";
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
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { BillingActions } from "./actions";

function invoiceStatusBadge(status: string) {
    switch (status) {
        case "PAID":
            return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</Badge>;
        case "PENDING":
            return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
        case "OVERDUE":
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</Badge>;
        case "CANCELLED":
            return <Badge variant="secondary">Cancelled</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export default async function BillingPage() {
    const billing = await getBillingOverview();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Billing & Invoices
                </h1>
                <p className="text-muted-foreground">
                    Revenue metrics and invoice management.
                </p>
            </div>

            {/* Revenue Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            GHS {Math.round(billing.mrr).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ARR</CardTitle>
                        <TrendingUp className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            GHS {Math.round(billing.arr).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Annual recurring revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                        <CheckCircle className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{billing.paidCount}</div>
                        <p className="text-xs text-muted-foreground">{billing.pendingCount} pending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <AlertTriangle className="size-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{billing.overdueCount}</div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Create Invoice */}
            <BillingActions tenants={billing.tenants.map((t) => ({ id: t.id, name: t.name }))} />

            {/* Invoice Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>
                        {billing.invoices.length} invoice{billing.invoices.length !== 1 ? "s" : ""} found.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {billing.invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            No invoices yet. Create one above.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Paid At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billing.invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.tenant.name}</TableCell>
                                        <TableCell>{inv.period}</TableCell>
                                        <TableCell>
                                            {inv.currency} {Number(inv.amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>{invoiceStatusBadge(inv.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(inv.dueDate).toLocaleDateString("en-GH")}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-GH") : "—"}
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
