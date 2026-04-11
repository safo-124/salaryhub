import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download } from "lucide-react";
import { getPayslip } from "@/lib/actions/payroll";

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export default async function PayslipDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const payslip = await getPayslip(id);

    if (!payslip) notFound();

    const statusColors: Record<string, string> = {
        PAID: "bg-success/10 text-success",
        APPROVED: "bg-primary/10 text-primary",
        PENDING_APPROVAL: "bg-warning/10 text-warning",
        DRAFT: "bg-muted text-muted-foreground",
        PROCESSING: "bg-info/10 text-info",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" render={<Link href={`/payroll/${payslip.payrollRunId}`} />}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payslip</h1>
                        <p className="text-muted-foreground">
                            {payslip.employeeName} · {payslip.period}
                        </p>
                    </div>
                </div>
                <Button variant="outline" nativeButton={false} render={<a href={`/api/payslips/${id}/pdf`} download />}>
                    <Download className="mr-2 size-4" />
                    Download PDF
                </Button>
            </div>

            <Card className="max-w-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            {payslip.period}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {payslip.employeeName} ({payslip.employeeCode})
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className={statusColors[payslip.runStatus] || ""}
                    >
                        {payslip.runStatus}
                    </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Net Pay Highlight */}
                    <div className="rounded-xl bg-primary/5 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Net Pay</p>
                        <p className="text-3xl font-bold tabular-nums text-primary">
                            {fmtGHS(payslip.netPay)}
                        </p>
                    </div>

                    {/* Earnings */}
                    <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Earnings
                        </h3>
                        <PayslipRow label="Basic Salary" value={fmtGHS(payslip.basicSalary)} />
                        <PayslipRow label="Allowances" value={fmtGHS(payslip.allowances)} />
                        <PayslipRow label="Overtime" value={fmtGHS(payslip.overtime)} />
                        <Separator className="my-2" />
                        <PayslipRow
                            label="Gross Pay"
                            value={fmtGHS(payslip.grossPay)}
                            bold
                        />
                    </div>

                    {/* Deductions */}
                    <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Deductions
                        </h3>
                        <PayslipRow
                            label="SSNIT (5.5%)"
                            value={`-${fmtGHS(payslip.ssnitEmployee)}`}
                            negative
                        />
                        <PayslipRow
                            label="Tier 2 (5%)"
                            value={`-${fmtGHS(payslip.tier2)}`}
                            negative
                        />
                        <PayslipRow
                            label="PAYE"
                            value={`-${fmtGHS(payslip.paye)}`}
                            negative
                        />
                        {payslip.otherDeductions > 0 && (
                            <PayslipRow
                                label="Other Deductions"
                                value={`-${fmtGHS(payslip.otherDeductions)}`}
                                negative
                            />
                        )}
                    </div>

                    <Separator />

                    <PayslipRow label="Net Pay" value={fmtGHS(payslip.netPay)} bold />

                    {/* Employer Contributions */}
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Employer Contribution
                        </p>
                        <p className="text-sm tabular-nums">
                            SSNIT (13%): {fmtGHS(payslip.ssnitEmployer)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PayslipRow({
    label,
    value,
    bold,
    negative,
}: {
    label: string;
    value: string;
    bold?: boolean;
    negative?: boolean;
}) {
    return (
        <div className="flex justify-between py-1">
            <span
                className={
                    bold ? "text-sm font-semibold" : "text-sm text-muted-foreground"
                }
            >
                {label}
            </span>
            <span
                className={`tabular-nums text-sm ${bold ? "font-semibold" : ""} ${negative ? "text-destructive" : ""}`}
            >
                {value}
            </span>
        </div>
    );
}
