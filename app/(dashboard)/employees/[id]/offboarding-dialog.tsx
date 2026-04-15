"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
    calculateFinalPay,
    processOffboarding,
    getClearanceItems,
} from "@/lib/actions/offboarding";

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

type FinalPayData = {
    employeeName: string;
    employeeId: string;
    basicSalary: number;
    allowances: number;
    monthlySalary: number;
    daysInMonth: number;
    daysWorked: number;
    proratedSalary: number;
    unusedLeaveDays: number;
    leavePayout: number;
    totalFinalPay: number;
};

export function OffboardingDialog({
    employeeId,
    employeeName,
    status,
}: {
    employeeId: string;
    employeeName: string;
    status: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [terminationDate, setTerminationDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [reason, setReason] = useState("");
    const [finalPay, setFinalPay] = useState<FinalPayData | null>(null);
    const [clearance, setClearance] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const clearanceItems = getClearanceItems();
    const allCleared = clearanceItems.every((item) => clearance[item.key]);

    async function handleCalculate() {
        setCalculating(true);
        const result = await calculateFinalPay(employeeId, terminationDate);
        setCalculating(false);
        if (result.success && result.data) {
            setFinalPay(result.data);
        } else {
            toast.error(result.error || "Calculation failed");
        }
    }

    async function handleProcess() {
        if (!allCleared) {
            toast.error("Complete all clearance items first");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.set("employeeId", employeeId);
        formData.set("terminationDate", terminationDate);
        formData.set("terminationReason", reason);
        const result = await processOffboarding(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Employee offboarded successfully");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || "Offboarding failed");
        }
    }

    if (status === "TERMINATED") return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="destructive" />}>
                <UserX className="mr-2 size-4" />
                Offboard
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-destructive" />
                        Offboard {employeeName}
                    </DialogTitle>
                    <DialogDescription>
                        Process employee exit with final pay calculation and clearance checklist.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Termination Details */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="terminationDate">Last Working Day</Label>
                            <Input
                                id="terminationDate"
                                type="date"
                                value={terminationDate}
                                onChange={(e) => setTerminationDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Separation</Label>
                            <Input
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Resignation, End of contract, Redundancy"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Final Pay */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Final Pay Calculation</h3>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCalculate}
                                disabled={calculating}
                            >
                                {calculating ? "Calculating..." : "Calculate"}
                            </Button>
                        </div>

                        {finalPay && (
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Prorated salary ({finalPay.daysWorked}/{finalPay.daysInMonth} days)
                                    </span>
                                    <span>{fmtGHS(finalPay.proratedSalary)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Unused leave payout ({finalPay.unusedLeaveDays} days)
                                    </span>
                                    <span>{fmtGHS(finalPay.leavePayout)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total Final Pay</span>
                                    <span>{fmtGHS(finalPay.totalFinalPay)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Clearance Checklist */}
                    <div className="space-y-3">
                        <h3 className="font-medium">Clearance Checklist</h3>
                        <div className="space-y-2">
                            {clearanceItems.map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                                >
                                    <Checkbox
                                        checked={clearance[item.key] || false}
                                        onCheckedChange={(checked) =>
                                            setClearance((prev) => ({
                                                ...prev,
                                                [item.key]: !!checked,
                                            }))
                                        }
                                    />
                                    <span className="text-sm">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleProcess}
                        disabled={loading || !allCleared}
                    >
                        {loading
                            ? "Processing..."
                            : allCleared
                                ? "Complete Offboarding"
                                : "Complete clearance checklist first"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
