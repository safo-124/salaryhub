"use client";

import { useActionState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { runPayroll } from "@/lib/actions/payroll";

type FormState = { error?: string; success?: boolean } | undefined;

export default function RunPayrollPage() {
    const router = useRouter();

    // Default to current month
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    async function handleSubmit(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const result = await runPayroll(formData);
        if (result.success) {
            router.push(`/payroll/${result.id}`);
            return { success: true };
        }
        return { error: result.error || "Failed to run payroll" };
    }

    const [state, formAction, isPending] = useActionState(
        handleSubmit,
        undefined
    );

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
                    <form action={formAction} className="space-y-4">
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
                                <li>Generate payslips for all 5 active employees</li>
                            </ul>
                        </div>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Processing..." : "Run Payroll"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
