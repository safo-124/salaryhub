"use client";

import { useState } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, FileText, Landmark, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    generateGRAPAYEReturn,
    generateSSNITReturn,
    exportGRAPAYECSV,
    exportSSNITCSV,
} from "@/lib/actions/statutory-reports";

type Period = { period: string; status: string };

type PAYERow = {
    employeeId: string;
    name: string;
    tin: string;
    basicSalary: number;
    allowances: number;
    grossPay: number;
    ssnitEmployee: number;
    tier2: number;
    taxableIncome: number;
    paye: number;
};

type PAYETotals = {
    basicSalary: number;
    allowances: number;
    grossPay: number;
    ssnitEmployee: number;
    tier2: number;
    taxableIncome: number;
    paye: number;
};

type SSNITRow = {
    employeeId: string;
    name: string;
    ssnit: string;
    basicSalary: number;
    ssnitEmployee: number;
    ssnitEmployer: number;
    tier1Total: number;
    tier2: number;
};

type SSNITTotals = {
    basicSalary: number;
    ssnitEmployee: number;
    ssnitEmployer: number;
    tier1Total: number;
    tier2: number;
};

function fmtGHS(n: number) {
    return n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReportsClient({ periods }: { periods: Period[] }) {
    const [selectedPeriod, setSelectedPeriod] = useState<string>("");
    const [activeReport, setActiveReport] = useState<"paye" | "ssnit" | null>(null);
    const [payeData, setPayeData] = useState<{ rows: PAYERow[]; totals: PAYETotals; tenantName: string } | null>(null);
    const [ssnitData, setSsnitData] = useState<{ rows: SSNITRow[]; totals: SSNITTotals; tenantName: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGeneratePAYE() {
        if (!selectedPeriod) return;
        setLoading(true);
        setError(null);
        const result = await generateGRAPAYEReturn(selectedPeriod);
        setLoading(false);
        if (result.success) {
            setPayeData(result.data as { rows: PAYERow[]; totals: PAYETotals; tenantName: string });
            setActiveReport("paye");
        } else {
            setError(result.error);
        }
    }

    async function handleGenerateSSNIT() {
        if (!selectedPeriod) return;
        setLoading(true);
        setError(null);
        const result = await generateSSNITReturn(selectedPeriod);
        setLoading(false);
        if (result.success) {
            setSsnitData(result.data as { rows: SSNITRow[]; totals: SSNITTotals; tenantName: string });
            setActiveReport("ssnit");
        } else {
            setError(result.error);
        }
    }

    async function handleExportCSV(type: "paye" | "ssnit") {
        if (!selectedPeriod) return;
        const csv = type === "paye"
            ? await exportGRAPAYECSV(selectedPeriod)
            : await exportSSNITCSV(selectedPeriod);
        if (typeof csv !== "string") {
            toast.error("Failed to generate CSV");
            return;
        }
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type === "paye" ? "GRA-PAYE" : "SSNIT"}-${selectedPeriod}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV downloaded");
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Period</CardTitle>
                    <CardDescription>
                        Choose a payroll period to generate statutory reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {periods.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No payroll runs found. Run payroll first to generate reports.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            <Select
                                value={selectedPeriod}
                                onValueChange={(v) => v && setSelectedPeriod(v)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((p) => (
                                        <SelectItem key={p.period} value={p.period}>
                                            {p.period}{" "}
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {p.status.replace("_", " ")}
                                            </Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleGeneratePAYE}
                                disabled={!selectedPeriod || loading}
                                variant={activeReport === "paye" ? "default" : "outline"}
                            >
                                <FileText className="mr-2 size-4" />
                                GRA PAYE Return
                            </Button>

                            <Button
                                onClick={handleGenerateSSNIT}
                                disabled={!selectedPeriod || loading}
                                variant={activeReport === "ssnit" ? "default" : "outline"}
                            >
                                <Landmark className="mr-2 size-4" />
                                SSNIT Contribution
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="size-5 shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* GRA PAYE Report */}
            {activeReport === "paye" && payeData && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>GRA PAYE Monthly Return</CardTitle>
                            <CardDescription>
                                {payeData.tenantName} — {selectedPeriod} — {payeData.rows.length} employee(s)
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV("paye")}>
                            <Download className="mr-2 size-4" />
                            Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>TIN</TableHead>
                                        <TableHead className="text-right">Basic</TableHead>
                                        <TableHead className="text-right">Allowances</TableHead>
                                        <TableHead className="text-right">Gross</TableHead>
                                        <TableHead className="text-right">SSNIT (5.5%)</TableHead>
                                        <TableHead className="text-right">Tier 2 (5%)</TableHead>
                                        <TableHead className="text-right">Taxable</TableHead>
                                        <TableHead className="text-right font-bold">PAYE</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payeData.rows.map((r) => (
                                        <TableRow key={r.employeeId}>
                                            <TableCell>
                                                <span className="font-medium">{r.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{r.employeeId}</span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{r.tin}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.basicSalary)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.allowances)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.grossPay)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.ssnitEmployee)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.tier2)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.taxableIncome)}</TableCell>
                                            <TableCell className="text-right tabular-nums font-bold">{fmtGHS(r.paye)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-t-2 font-bold">
                                        <TableCell colSpan={2}>TOTALS</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.basicSalary)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.allowances)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.grossPay)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.ssnitEmployee)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.tier2)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.taxableIncome)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(payeData.totals.paye)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* SSNIT Report */}
            {activeReport === "ssnit" && ssnitData && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>SSNIT Monthly Contribution Report</CardTitle>
                            <CardDescription>
                                {ssnitData.tenantName} — {selectedPeriod} — {ssnitData.rows.length} employee(s)
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV("ssnit")}>
                            <Download className="mr-2 size-4" />
                            Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>SSNIT No.</TableHead>
                                        <TableHead className="text-right">Basic Salary</TableHead>
                                        <TableHead className="text-right">Employee (5.5%)</TableHead>
                                        <TableHead className="text-right">Employer (13%)</TableHead>
                                        <TableHead className="text-right">Tier 1 Total</TableHead>
                                        <TableHead className="text-right">Tier 2 (5%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ssnitData.rows.map((r) => (
                                        <TableRow key={r.employeeId}>
                                            <TableCell>
                                                <span className="font-medium">{r.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{r.employeeId}</span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{r.ssnit}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.basicSalary)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.ssnitEmployee)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.ssnitEmployer)}</TableCell>
                                            <TableCell className="text-right tabular-nums font-bold">{fmtGHS(r.tier1Total)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(r.tier2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-t-2 font-bold">
                                        <TableCell colSpan={2}>TOTALS</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(ssnitData.totals.basicSalary)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(ssnitData.totals.ssnitEmployee)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(ssnitData.totals.ssnitEmployer)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(ssnitData.totals.tier1Total)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{fmtGHS(ssnitData.totals.tier2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
