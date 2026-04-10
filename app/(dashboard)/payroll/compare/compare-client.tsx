"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { comparePayrolls } from "@/lib/actions/compare";

type Period = { id: string; period: string };

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function DiffIndicator({ a, b }: { a: number; b: number }) {
    const diff = b - a;
    const pct = a > 0 ? ((diff / a) * 100).toFixed(1) : "—";
    if (diff > 0) return <span className="text-xs text-green-600">+{pct}%</span>;
    if (diff < 0) return <span className="text-xs text-red-600">{pct}%</span>;
    return <span className="text-xs text-muted-foreground">0%</span>;
}

type CompareResult = {
    summaryA: { period: string; gross: number; net: number; tax: number; count: number };
    summaryB: { period: string; gross: number; net: number; tax: number; count: number };
    employees: { name: string; code: string; grossA: number; grossB: number; netA: number; netB: number }[];
};

export function CompareClient({ periods }: { periods: Period[] }) {
    const [periodA, setPeriodA] = useState("");
    const [periodB, setPeriodB] = useState("");
    const [result, setResult] = useState<CompareResult | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCompare() {
        if (!periodA || !periodB || periodA === periodB) return;
        setLoading(true);
        const data = await comparePayrolls(periodA, periodB);
        setResult(data);
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Period A</label>
                            <Select value={periodA} onValueChange={(v) => v && setPeriodA(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.period}>{p.period}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowLeftRight className="size-5 text-muted-foreground mb-2" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Period B</label>
                            <Select value={periodB} onValueChange={(v) => v && setPeriodB(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.period}>{p.period}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleCompare} disabled={loading || !periodA || !periodB || periodA === periodB}>
                            {loading ? "Comparing..." : "Compare"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Gross</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryA.gross)}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryB.gross)}</span>
                                </div>
                                <DiffIndicator a={result.summaryA.gross} b={result.summaryB.gross} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Net</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryA.net)}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryB.net)}</span>
                                </div>
                                <DiffIndicator a={result.summaryA.net} b={result.summaryB.net} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Tax</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryA.tax)}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-lg font-bold">{fmtGHS(result.summaryB.tax)}</span>
                                </div>
                                <DiffIndicator a={result.summaryA.tax} b={result.summaryB.tax} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Employee Details</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Gross ({result.summaryA.period})</TableHead>
                                        <TableHead className="text-right">Gross ({result.summaryB.period})</TableHead>
                                        <TableHead className="text-right">Diff</TableHead>
                                        <TableHead className="text-right">Net ({result.summaryA.period})</TableHead>
                                        <TableHead className="text-right">Net ({result.summaryB.period})</TableHead>
                                        <TableHead className="text-right">Diff</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.employees.map((emp) => (
                                        <TableRow key={emp.code}>
                                            <TableCell>
                                                <div className="font-medium">{emp.name}</div>
                                                <div className="text-xs text-muted-foreground">{emp.code}</div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(emp.grossA)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(emp.grossB)}</TableCell>
                                            <TableCell className="text-right"><DiffIndicator a={emp.grossA} b={emp.grossB} /></TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(emp.netA)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{fmtGHS(emp.netB)}</TableCell>
                                            <TableCell className="text-right"><DiffIndicator a={emp.netA} b={emp.netB} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
