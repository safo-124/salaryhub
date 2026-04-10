"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { updateOnboardingItem } from "@/lib/actions/employees";
import { toast } from "sonner";

type Onboarding = {
    id: string;
    onboardBankDetails: boolean;
    onboardSsnit: boolean;
    onboardTin: boolean;
    onboardContract: boolean;
    onboardIdDocument: boolean;
    onboardEmergContact: boolean;
};

const items = [
    { field: "onboardBankDetails", label: "Bank Details", desc: "Bank name & account number collected" },
    { field: "onboardSsnit", label: "SSNIT Registration", desc: "Social security number registered" },
    { field: "onboardTin", label: "Tax ID (TIN)", desc: "Tax identification number on file" },
    { field: "onboardContract", label: "Employment Contract", desc: "Contract signed and filed" },
    { field: "onboardIdDocument", label: "ID Document", desc: "National ID / passport copied" },
    { field: "onboardEmergContact", label: "Emergency Contact", desc: "Emergency contact info collected" },
];

export function OnboardingChecklist({ onboarding }: { onboarding: Onboarding }) {
    const router = useRouter();
    const completedCount = items.filter((item) => onboarding[item.field as keyof Onboarding] === true).length;
    const progress = Math.round((completedCount / items.length) * 100);

    async function handleToggle(field: string, checked: boolean) {
        const result = await updateOnboardingItem(onboarding.id, field, checked);
        if (result.success) {
            toast.success(checked ? "Item completed" : "Item unchecked");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update");
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Onboarding Checklist</CardTitle>
                    <span className="text-sm font-medium text-muted-foreground">
                        {completedCount}/{items.length} ({progress}%)
                    </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.map((item) => {
                        const checked = onboarding[item.field as keyof Onboarding] === true;
                        return (
                            <label
                                key={item.field}
                                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => handleToggle(item.field, !!v)}
                                    className="mt-0.5"
                                />
                                <div>
                                    <p className={`text-sm font-medium ${checked ? "line-through text-muted-foreground" : ""}`}>
                                        {item.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
