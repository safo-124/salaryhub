"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { getApprovalStatus, processApprovalStep } from "@/lib/actions/approval-chains";

type StepStatus = {
    id: string;
    stepOrder: number;
    stepRole: string;
    stepLabel: string;
    action: string;
    actorName: string | null;
    comment: string | null;
    actedAt: string | null;
};

export function ApprovalStatusButton({ requestId }: { requestId: string }) {
    const [open, setOpen] = useState(false);
    const [steps, setSteps] = useState<StepStatus[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getApprovalStatus(requestId).then((s) => {
                setSteps(s);
                setLoading(false);
            });
        }
    }, [open, requestId]);

    async function handleAction(action: "APPROVED" | "REJECTED") {
        setProcessing(true);
        const result = await processApprovalStep(requestId, action, comment);
        setProcessing(false);
        if (result.success) {
            toast.success(action === "APPROVED" ? "Step approved" : "Request rejected");
            // Refresh steps
            const updated = await getApprovalStatus(requestId);
            setSteps(updated);
            setComment("");
        } else {
            toast.error(result.error || "Action failed");
        }
    }

    // Don't show button if no approval chain exists
    if (steps !== null && steps.length === 0) return null;

    const actionIcon = {
        APPROVED: <CheckCircle className="size-4 text-success" />,
        REJECTED: <XCircle className="size-4 text-destructive" />,
        PENDING: <Clock className="size-4 text-warning" />,
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                <GitBranch className="size-4" />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approval Chain</DialogTitle>
                    <DialogDescription>
                        Multi-level approval progress for this request.
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !steps || steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No approval chain configured for this request.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className="flex items-start gap-3 rounded-lg border p-3"
                            >
                                {actionIcon[step.action as keyof typeof actionIcon] || actionIcon.PENDING}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Step {step.stepOrder}: {step.stepLabel}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                step.action === "APPROVED"
                                                    ? "bg-success/10 text-success"
                                                    : step.action === "REJECTED"
                                                        ? "bg-destructive/10 text-destructive"
                                                        : "bg-warning/10 text-warning"
                                            }
                                        >
                                            {step.action}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Requires: {step.stepRole.replace("_", " ")}
                                        {step.actorName && ` · ${step.actorName}`}
                                        {step.actedAt &&
                                            ` · ${new Date(step.actedAt).toLocaleDateString()}`}
                                    </p>
                                    {step.comment && (
                                        <p className="mt-1 text-xs italic">{step.comment}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {steps.some((s) => s.action === "PENDING") && (
                            <div className="space-y-3 border-t pt-3">
                                <Input
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Optional comment..."
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAction("APPROVED")}
                                        disabled={processing}
                                    >
                                        <CheckCircle className="mr-2 size-4" />
                                        Approve Step
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleAction("REJECTED")}
                                        disabled={processing}
                                    >
                                        <XCircle className="mr-2 size-4" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
