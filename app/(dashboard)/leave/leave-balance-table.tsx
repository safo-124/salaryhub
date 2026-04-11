"use client";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Balance = {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    type: string;
    entitled: number;
    carried: number;
    used: number;
    pending: number;
    remaining: number;
};

const typeColors: Record<string, string> = {
    ANNUAL: "bg-primary/10 text-primary",
    SICK: "bg-destructive/10 text-destructive",
    MATERNITY: "bg-info/10 text-info",
    PATERNITY: "bg-info/10 text-info",
    UNPAID: "bg-muted text-muted-foreground",
    COMPASSIONATE: "bg-accent text-accent-foreground",
};

export function LeaveBalanceTable({ balances }: { balances: Balance[] }) {
    // Group by employee
    const grouped = balances.reduce<Record<string, Balance[]>>((acc, b) => {
        const key = b.employeeId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
    }, {});

    const employees = Object.entries(grouped);

    if (employees.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No leave balances yet. Balances are auto-created when employees are added or leave is requested.
            </p>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Entitled</TableHead>
                    <TableHead className="text-right">Carried</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map(([empId, empBalances]) => (
                    empBalances.map((b, i) => (
                        <TableRow key={b.id}>
                            {i === 0 && (
                                <TableCell rowSpan={empBalances.length} className="align-top font-medium">
                                    <div>{b.employeeName}</div>
                                    <div className="text-xs text-muted-foreground">{b.employeeCode}</div>
                                </TableCell>
                            )}
                            <TableCell>
                                <Badge variant="secondary" className={typeColors[b.type] || ""}>
                                    {b.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{b.entitled}</TableCell>
                            <TableCell className="text-right tabular-nums">{b.carried > 0 ? `+${b.carried}` : "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{b.used}</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {b.pending > 0 ? <span className="text-warning">{b.pending}</span> : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                                <span className={b.remaining <= 0 ? "text-destructive" : b.remaining <= 3 ? "text-warning" : ""}>
                                    {b.remaining}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))
                ))}
            </TableBody>
        </Table>
    );
}
