import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { getPayrollRun } from "@/lib/actions/payroll";
import { PayrollActions } from "./actions";

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

export default async function PayrollDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const run = await getPayrollRun(id);

    if (!run) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" render={<Link href="/payroll" />}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Payroll — {run.period}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={statusColors[run.status]}
                            >
                                {run.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {run.employeeCount} employees · Processed by{" "}
                            {run.processedBy || "—"}
                        </p>
                    </div>
                </div>
                <PayrollActions id={run.id} status={run.status} />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Gross</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">
                            {fmtGHS(run.totalGross)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tax (PAYE)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">
                            {fmtGHS(run.totalTax)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums text-primary">
                            {fmtGHS(run.totalNet)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payslip Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Breakdown</CardTitle>
                    <CardDescription>
                        Individual payslips for this payroll run.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Basic</TableHead>
                                <TableHead className="text-right">Allowances</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right">SSNIT</TableHead>
                                <TableHead className="text-right">Tier 2</TableHead>
                                <TableHead className="text-right">PAYE</TableHead>
                                <TableHead className="text-right">Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {run.payslips.map((slip) => (
                                <TableRow key={slip.id}>
                                    <TableCell>
                                        <Link
                                            href={`/payslips/${slip.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {slip.employeeName}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {slip.employeeCode}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.basicSalary)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.allowances)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.grossPay)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.ssnitEmployee)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.tier2)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {fmtGHS(slip.paye)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums font-medium">
                                        {fmtGHS(slip.netPay)}
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
