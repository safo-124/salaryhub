import Link from "next/link";
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
import { Play, ArrowLeftRight } from "lucide-react";
import { getPayrollRuns } from "@/lib/actions/payroll";

const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PROCESSING: "bg-info/10 text-info",
    PENDING_APPROVAL: "bg-warning/10 text-warning",
    APPROVED: "bg-primary/10 text-primary",
    PAID: "bg-success/10 text-success",
};

export default async function PayrollPage() {
    const runs = await getPayrollRuns();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
                    <p className="text-muted-foreground">
                        Run and manage monthly payroll.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" render={<Link href="/payroll/compare" />}>
                        <ArrowLeftRight className="mr-2 size-4" />
                        Compare
                    </Button>
                    <Button render={<Link href="/payroll/run" />}>
                        <Play className="mr-2 size-4" />
                        Run Payroll
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Runs</CardTitle>
                    <CardDescription>
                        {runs.length === 0
                            ? "No payroll runs yet. Click Run Payroll to start."
                            : `${runs.length} payroll run${runs.length !== 1 ? "s" : ""}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {runs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">
                                No payroll history yet.
                            </p>
                            <Button className="mt-4" render={<Link href="/payroll/run" />}>
                                Run Your First Payroll
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead className="text-right">Total Gross</TableHead>
                                    <TableHead className="text-right">Total Net</TableHead>
                                    <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map((run) => (
                                    <TableRow key={run.id}>
                                        <TableCell>
                                            <Link
                                                href={`/payroll/${run.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {run.period}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[run.status]}
                                            >
                                                {run.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{run.employeeCount}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            GHS{" "}
                                            {run.totalGross.toLocaleString("en-GH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            GHS{" "}
                                            {run.totalNet.toLocaleString("en-GH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {run.processedAt
                                                ? new Date(run.processedAt).toLocaleDateString()
                                                : "—"}
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
