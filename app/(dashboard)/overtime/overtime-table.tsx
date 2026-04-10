"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { bulkApproveOvertime, bulkRejectOvertime, approveOvertimeEntry, rejectOvertimeEntry } from "@/lib/actions/overtime";
import { toast } from "sonner";

type OvertimeEntry = {
    id: string;
    employeeName: string;
    employeeCode: string;
    date: string;
    overtimeHours: number;
    rate: number;
    amount: number;
    status: string;
};

const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-destructive/10 text-destructive",
};

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export function OvertimeTable({ entries }: { entries: OvertimeEntry[] }) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const pendingIds = entries.filter((e) => e.status === "PENDING").map((e) => e.id);
    const selectedPending = [...selected].filter((id) => pendingIds.includes(id));

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selectedPending.length === pendingIds.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(pendingIds));
        }
    }

    async function handleBulkApprove() {
        if (selectedPending.length === 0) return;
        setLoading(true);
        const result = await bulkApproveOvertime(selectedPending);
        setLoading(false);
        toast.success(`${result.count} overtime entr${result.count !== 1 ? "ies" : "y"} approved`);
        setSelected(new Set());
        router.refresh();
    }

    async function handleBulkReject() {
        if (selectedPending.length === 0) return;
        setLoading(true);
        const result = await bulkRejectOvertime(selectedPending);
        setLoading(false);
        toast.success(`${result.count} overtime entr${result.count !== 1 ? "ies" : "y"} rejected`);
        setSelected(new Set());
        router.refresh();
    }

    async function handleApprove(id: string) {
        await approveOvertimeEntry(id);
        toast.success("Overtime entry approved");
        router.refresh();
    }

    async function handleReject(id: string) {
        await rejectOvertimeEntry(id);
        toast.success("Overtime entry rejected");
        router.refresh();
    }

    return (
        <div className="space-y-3">
            {selectedPending.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                    <span className="text-sm font-medium">{selectedPending.length} selected</span>
                    <Button size="sm" onClick={handleBulkApprove} disabled={loading}>
                        <CheckCircle className="mr-1 size-4" />
                        Approve All
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkReject} disabled={loading}>
                        <XCircle className="mr-1 size-4" />
                        Reject All
                    </Button>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            {pendingIds.length > 0 && (
                                <Checkbox
                                    checked={selectedPending.length === pendingIds.length && pendingIds.length > 0}
                                    onCheckedChange={toggleAll}
                                />
                            )}
                        </TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">OT Hours</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>
                                {entry.status === "PENDING" && (
                                    <Checkbox
                                        checked={selected.has(entry.id)}
                                        onCheckedChange={() => toggleSelect(entry.id)}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{entry.employeeName}</div>
                                <div className="text-xs text-muted-foreground">{entry.employeeCode}</div>
                            </TableCell>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.overtimeHours.toFixed(1)}h</TableCell>
                            <TableCell className="text-right tabular-nums">{entry.rate}x</TableCell>
                            <TableCell className="text-right tabular-nums">{fmtGHS(entry.amount)}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={statusColors[entry.status] || ""}>{entry.status}</Badge>
                            </TableCell>
                            <TableCell>
                                {entry.status === "PENDING" && (
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => handleApprove(entry.id)}>
                                            <CheckCircle className="size-4 text-green-600" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleReject(entry.id)}>
                                            <XCircle className="size-4 text-red-600" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
