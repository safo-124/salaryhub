"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { runPayroll } from "@/lib/actions/payroll";
import { toast } from "sonner";

type FormState = { error?: string; success?: boolean } | undefined;

export default function RunPayrollPage() {
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

    // Default to current month
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    async function handleSubmit(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const result = await runPayroll(formData);
        if (result.success) {
            toast.success("Payroll processed successfully!");
            router.push(`/payroll/${result.id}`);
            return { success: true };
        }
        toast.error(result.error || "Failed to run payroll");
        return { error: result.error || "Failed to run payroll" };
    }

    const [state, formAction, isPending] = useActionState(
        handleSubmit,
        undefined
    );

    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setPendingFormData(formData);
        setConfirmOpen(true);
    }

    function handleConfirm() {
        setConfirmOpen(false);
        if (pendingFormData) {
            formAction(pendingFormData);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" render={<Link href="/payroll" />}>
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Run Payroll</h1>
                    <p className="text-muted-foreground">
                        Process payroll for all active employees.
                    </p>
                </div>
            </div>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Payroll Period</CardTitle>
                    <CardDescription>
                        Select the month to process. All active employees will be included.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {state?.error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {state.error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="period">Period</Label>
                            <Input
                                id="period"
                                name="period"
                                type="month"
                                defaultValue={defaultPeriod}
                                required
                            />
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-sm">
                            <p className="font-medium">This will:</p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                                <li>Calculate SSNIT (5.5% employee, 13% employer)</li>
                                <li>Calculate Tier 2 pension (5%)</li>
                                <li>Calculate PAYE using Ghana tax brackets</li>
                                <li>Generate payslips for all active employees</li>
                            </ul>
                        </div>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Processing..." : "Run Payroll"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Payroll Run</DialogTitle>
                        <DialogDescription>
                            You are about to process payroll for <strong>{pendingFormData?.get("period") as string}</strong>.
                            This will calculate salaries, deductions, and PAYE for all active employees and generate payslips.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm}>
                            Confirm & Run
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
