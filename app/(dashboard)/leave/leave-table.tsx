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
import { bulkApproveLeave, bulkRejectLeave, approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/leave";
import { ApprovalStatusButton } from "@/components/approval-status-button";
import { toast } from "sonner";

type LeaveRequest = {
    id: string;
    employeeName: string;
    employeeCode: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
};

const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-destructive/10 text-destructive",
};

const typeColors: Record<string, string> = {
    ANNUAL: "bg-primary/10 text-primary",
    SICK: "bg-destructive/10 text-destructive",
    MATERNITY: "bg-info/10 text-info",
    PATERNITY: "bg-info/10 text-info",
    UNPAID: "bg-muted text-muted-foreground",
    COMPASSIONATE: "bg-accent text-accent-foreground",
};

export function LeaveTable({ requests }: { requests: LeaveRequest[] }) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const pendingIds = requests.filter((r) => r.status === "PENDING").map((r) => r.id);
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
        const result = await bulkApproveLeave(selectedPending);
        setLoading(false);
        toast.success(`${result.count} leave request(s) approved`);
        setSelected(new Set());
        router.refresh();
    }

    async function handleBulkReject() {
        if (selectedPending.length === 0) return;
        setLoading(true);
        const result = await bulkRejectLeave(selectedPending);
        setLoading(false);
        toast.success(`${result.count} leave request(s) rejected`);
        setSelected(new Set());
        router.refresh();
    }

    async function handleApprove(id: string) {
        await approveLeaveRequest(id);
        toast.success("Leave request approved");
        router.refresh();
    }

    async function handleReject(id: string) {
        await rejectLeaveRequest(id);
        toast.success("Leave request rejected");
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
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell>
                                {req.status === "PENDING" && (
                                    <Checkbox
                                        checked={selected.has(req.id)}
                                        onCheckedChange={() => toggleSelect(req.id)}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{req.employeeName}</div>
                                <div className="text-xs text-muted-foreground">{req.employeeCode}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={typeColors[req.type] || ""}>{req.type}</Badge>
                            </TableCell>
                            <TableCell>{req.startDate}</TableCell>
                            <TableCell>{req.endDate}</TableCell>
                            <TableCell>{req.days}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={statusColors[req.status] || ""}>{req.status}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <ApprovalStatusButton requestId={req.id} />
                                    {req.status === "PENDING" && (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => handleApprove(req.id)}>
                                                <CheckCircle className="size-4 text-green-600" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)}>
                                                <XCircle className="size-4 text-red-600" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
