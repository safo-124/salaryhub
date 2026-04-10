"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, FileCheck, Loader2 } from "lucide-react";
import { approvePayroll, markPayrollPaid } from "@/lib/actions/payroll";
import { useState } from "react";
import { toast } from "sonner";

const steps = [
    { key: "DRAFT", label: "Draft" },
    { key: "PROCESSING", label: "Processing" },
    { key: "PENDING_APPROVAL", label: "Pending Approval" },
    { key: "APPROVED", label: "Approved" },
    { key: "PAID", label: "Paid" },
];

function getStepIndex(status: string) {
    return steps.findIndex((s) => s.key === status);
}

export function PayrollActions({
    id,
    status,
}: {
    id: string;
    status: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const currentStep = getStepIndex(status);

    async function handleApprove() {
        setLoading(true);
        const result = await approvePayroll(id);
        setLoading(false);
        if (result.success) {
            toast.success("Payroll approved successfully");
        } else {
            toast.error(result.error || "Failed to approve");
        }
        router.refresh();
    }

    async function handleMarkPaid() {
        setLoading(true);
        const result = await markPayrollPaid(id);
        setLoading(false);
        if (result.success) {
            toast.success("Payroll marked as paid");
        } else {
            toast.error(result.error || "Failed to mark as paid");
        }
        router.refresh();
    }

    return (
        <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center gap-1">
                {steps.map((step, i) => (
                    <div key={step.key} className="flex items-center">
                        <div
                            className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${i < currentStep
                                    ? "bg-primary text-primary-foreground"
                                    : i === currentStep
                                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                        : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {i < currentStep ? (
                                <CheckCircle className="size-4" />
                            ) : (
                                i + 1
                            )}
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`h-0.5 w-6 ${i < currentStep ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {status === "PENDING_APPROVAL" && (
                    <Button onClick={handleApprove} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileCheck className="mr-2 size-4" />}
                        {loading ? "Approving..." : "Approve Payroll"}
                    </Button>
                )}
                {status === "APPROVED" && (
                    <Button onClick={handleMarkPaid} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CreditCard className="mr-2 size-4" />}
                        {loading ? "Processing..." : "Mark as Paid"}
                    </Button>
                )}
                {status === "PAID" && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                        <CheckCircle className="size-4" />
                        Payroll Complete
                    </div>
                )}
            </div>
        </div>
    );
}
