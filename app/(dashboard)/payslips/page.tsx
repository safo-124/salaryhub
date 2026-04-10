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
import { getPayslips } from "@/lib/actions/payroll";

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

export default async function PayslipsPage() {
    const payslips = await getPayslips();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payslips</h1>
                <p className="text-muted-foreground">
                    All generated payslips across payroll runs.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Payslips</CardTitle>
                    <CardDescription>
                        {payslips.length === 0
                            ? "No payslips yet. Run payroll to generate payslips."
                            : `${payslips.length} payslip${payslips.length !== 1 ? "s" : ""} total.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {payslips.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No payslips generated yet.
                        </p>
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
