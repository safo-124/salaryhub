import Link from "next/link";
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
import { FileText } from "lucide-react";
import { getPayslips } from "@/lib/actions/payroll";
import { PayslipSearch } from "./payslip-search";

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

export default async function PayslipsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; period?: string }>;
}) {
    const { q, period } = await searchParams;
    const allPayslips = await getPayslips();

    let payslips = allPayslips;
    if (q) {
        const query = q.toLowerCase();
        payslips = payslips.filter(
            (p) =>
                p.employeeName.toLowerCase().includes(query) ||
                p.employeeCode.toLowerCase().includes(query)
        );
    }
    if (period) {
        payslips = payslips.filter((p) => p.period === period);
    }

    // Get unique periods for filter
    const periods = [...new Set(allPayslips.map((p) => p.period))].sort().reverse();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payslips</h1>
                <p className="text-muted-foreground">
                    All generated payslips across payroll runs.
                </p>
            </div>

            <PayslipSearch currentQuery={q} currentPeriod={period} periods={periods} />

            <Card>
                <CardHeader>
                    <CardTitle>
                        {q || period ? "Filtered Payslips" : "All Payslips"}
                    </CardTitle>
                    <CardDescription>
                        {payslips.length === 0
                            ? "No payslips found."
                            : `${payslips.length} payslip${payslips.length !== 1 ? "s" : ""} ${q || period ? "found" : "total"}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {payslips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="mb-4 size-12 text-muted-foreground/50" />
                            {q || period ? (
                                <>
                                    <h3 className="text-lg font-medium">No payslips match your search</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Try adjusting your search or period filter.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium">No payslips yet</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Run payroll to generate payslips for your employees.
                                    </p>
                                    <Link href="/payroll/run" className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                        Run Payroll
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Gross Pay</TableHead>
                                    <TableHead className="text-right">PAYE</TableHead>
                                    <TableHead className="text-right">Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payslips.map((slip) => (
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
                                        <TableCell>{slip.period}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[slip.runStatus]}
                                            >
                                                {slip.runStatus.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {fmtGHS(slip.grossPay)}
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
