"use client";

import { useActionState, useState } from "react";
import { createInvoice } from "@/lib/actions/admin";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

async function handleCreateInvoice(
    _prev: { success?: boolean; error?: string } | null,
    formData: FormData
) {
    const tenantId = formData.get("tenantId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const period = formData.get("period") as string;
    const dueDate = formData.get("dueDate") as string;
    const description = formData.get("description") as string;

    if (!tenantId || !amount || !period || !dueDate) {
        return { error: "All fields are required" };
    }

    return createInvoice({ tenantId, amount, period, dueDate, description: description || undefined });
}

export function BillingActions({
    tenants,
}: {
    tenants: { id: string; name: string }[];
}) {
    const [state, formAction, isPending] = useActionState(handleCreateInvoice, null);
    const [showForm, setShowForm] = useState(false);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Create Invoice</CardTitle>
                        <CardDescription>Generate a new invoice for a tenant.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
                        {showForm ? <ChevronUp className="mr-1 size-4" /> : <ChevronDown className="mr-1 size-4" />}
                        {showForm ? "Hide" : "Show"}
                    </Button>
                </div>
            </CardHeader>
            {showForm && (
                <CardContent>
                    {state && "success" in state && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                            Invoice created successfully.
                        </div>
                    )}
                    {state && "error" in state && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {state.error}
                        </div>
                    )}

                    <form action={formAction} className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="tenantId">Tenant</Label>
                            <select
                                id="tenantId"
                                name="tenantId"
                                required
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Select tenant…</option>
                                {tenants.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="amount">Amount (GHS)</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="299.00" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="period">Period</Label>
                            <Input id="period" name="period" type="month" required />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" name="dueDate" type="date" required />
                        </div>
                        <div className="grid gap-1.5 md:col-span-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Input id="description" name="description" placeholder="Monthly subscription fee" />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={isPending}>
                                <Plus className="mr-2 size-4" />
                                {isPending ? "Creating…" : "Create Invoice"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            )}
        </Card>
    );
}
