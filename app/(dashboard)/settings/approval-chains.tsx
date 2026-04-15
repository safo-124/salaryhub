"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { upsertApprovalChain, type ApprovalStep } from "@/lib/actions/approval-chains";

type Chain = {
    id: string;
    category: string;
    steps: ApprovalStep[];
    isActive: boolean;
};

const CATEGORIES = [
    { value: "LEAVE", label: "Leave Requests" },
    { value: "OVERTIME", label: "Overtime Entries" },
];

const ROLES = [
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "HR_MANAGER", label: "HR Manager" },
    { value: "PAYROLL_ADMIN", label: "Payroll Admin" },
    { value: "OWNER", label: "Owner" },
];

export function ApprovalChainsManager({ chains }: { chains: Chain[] }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <GitBranch className="size-5" />
                    <div>
                        <CardTitle>Approval Chains</CardTitle>
                        <CardDescription>
                            Configure multi-level approval workflows for leave and overtime.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {CATEGORIES.map((cat) => {
                    const existing = chains.find((c) => c.category === cat.value);
                    return (
                        <ChainEditor
                            key={cat.value}
                            category={cat.value}
                            label={cat.label}
                            initial={existing}
                        />
                    );
                })}
            </CardContent>
        </Card>
    );
}

function ChainEditor({
    category,
    label,
    initial,
}: {
    category: string;
    label: string;
    initial?: Chain;
}) {
    const router = useRouter();
    const [isActive, setIsActive] = useState(initial?.isActive ?? false);
    const [steps, setSteps] = useState<ApprovalStep[]>(
        initial?.steps ?? [{ order: 1, role: "SUPERVISOR", label: "Supervisor Approval" }]
    );
    const [saving, setSaving] = useState(false);

    function addStep() {
        const next = steps.length > 0 ? Math.max(...steps.map((s) => s.order)) + 1 : 1;
        setSteps([...steps, { order: next, role: "HR_MANAGER", label: "" }]);
    }

    function removeStep(order: number) {
        setSteps(steps.filter((s) => s.order !== order));
    }

    function updateStep(order: number, field: keyof ApprovalStep, value: string | number) {
        setSteps(
            steps.map((s) => (s.order === order ? { ...s, [field]: value } : s))
        );
    }

    async function handleSave() {
        setSaving(true);
        const result = await upsertApprovalChain(
            category as "LEAVE" | "OVERTIME",
            steps,
            isActive
        );
        setSaving(false);
        if (result.success) {
            toast.success(`${label} approval chain saved`);
            router.refresh();
        } else {
            toast.error(result.error || "Save failed");
        }
    }

    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="font-medium">{label}</h3>
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${category}`} className="text-sm">
                        Enabled
                    </Label>
                    <Switch
                        id={`active-${category}`}
                        checked={isActive}
                        onCheckedChange={setIsActive}
                    />
                </div>
            </div>

            {steps.map((step, i) => (
                <div key={step.order} className="flex items-end gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {i + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">Role Required</Label>
                        <Select
                            value={step.role}
                            onValueChange={(v) => updateStep(step.order, "role", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">Step Label</Label>
                        <Input
                            value={step.label}
                            onChange={(e) =>
                                updateStep(step.order, "label", e.target.value)
                            }
                            placeholder="e.g. Manager Approval"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeStep(step.order)}
                        disabled={steps.length <= 1}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="mr-2 size-4" />
                    Add Step
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 size-4" />
                    {saving ? "Saving..." : "Save Chain"}
                </Button>
            </div>
        </div>
    );
}
