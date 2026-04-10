"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantSettings } from "@/lib/actions/settings";

export function SettingsForm({ billingEmail }: { billingEmail: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setSaved(false);
        await updateTenantSettings(formData);
        setLoading(false);
        setSaved(true);
        router.refresh();
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                    id="billingEmail"
                    name="billingEmail"
                    type="email"
                    defaultValue={billingEmail}
                    placeholder="billing@company.com"
                />
            </div>
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                </Button>
                {saved && (
                    <span className="text-sm text-green-600">Saved!</span>
                )}
            </div>
        </form>
    );
}
