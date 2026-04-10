"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantSettings } from "@/lib/actions/settings";
import { toast } from "sonner";

export function SettingsForm({ billingEmail }: { billingEmail: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await updateTenantSettings(formData);
        setLoading(false);
        toast.success("Settings saved");
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
            </div>
        </form>
    );
}
