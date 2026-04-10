"use client";

import { useActionState } from "react";
import { updateSettings } from "@/lib/actions/admin";
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
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";

const SETTINGS_SCHEMA = [
    {
        group: "General",
        description: "Platform-wide configuration.",
        fields: [
            { key: "platform_name", label: "Platform Name", description: "Displayed in all branding and emails.", default: "SalaryHub" },
            { key: "platform_version", label: "Platform Version", description: "Current deployment version.", default: "v1.0.0-alpha" },
            { key: "maintenance_mode", label: "Maintenance Mode", description: "Set to 'true' to show maintenance page.", default: "false" },
        ],
    },
    {
        group: "Tenant Defaults",
        description: "Default settings applied to new tenants.",
        fields: [
            { key: "default_plan", label: "Default Plan", description: "Plan assigned to new signups (STARTER, PROFESSIONAL, ENTERPRISE).", default: "STARTER" },
            { key: "default_country", label: "Default Country", description: "Default country code for new tenants.", default: "GH" },
            { key: "trial_duration_days", label: "Free Trial Duration (days)", description: "Days before billing begins.", default: "14" },
        ],
    },
    {
        group: "Security",
        description: "Platform security configuration.",
        fields: [
            { key: "session_duration_days", label: "Session Duration (days)", description: "How long admin sessions last.", default: "30" },
            { key: "api_rate_limit", label: "API Rate Limit (req/min)", description: "Requests per minute per tenant.", default: "100" },
        ],
    },
];

async function saveSettings(_prev: { success?: boolean; error?: string } | null, formData: FormData) {
    const settings: Record<string, string> = {};
    for (const group of SETTINGS_SCHEMA) {
        for (const field of group.fields) {
            const value = formData.get(field.key);
            if (typeof value === "string") {
                settings[field.key] = value;
            }
        }
    }
    return updateSettings(settings);
}

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
    const [state, formAction, isPending] = useActionState(saveSettings, null);

    return (
        <form action={formAction} className="space-y-6">
            {state && "success" in state && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Settings saved successfully.
                </div>
            )}
            {state && "error" in state && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {String(state.error)}
                </div>
            )}

            {SETTINGS_SCHEMA.map((group) => (
                <Card key={group.group}>
                    <CardHeader>
                        <CardTitle>{group.group}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {group.fields.map((field) => (
                            <div key={field.key} className="grid gap-1.5">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    name={field.key}
                                    defaultValue={settings[field.key] ?? field.default}
                                />
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <Card>
                <CardHeader>
                    <CardTitle>Supported Countries</CardTitle>
                    <CardDescription>Countries with active payroll engines.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            🇬🇭 Ghana — Active
                        </Badge>
                        <Badge variant="secondary">🇳🇬 Nigeria — Coming Soon</Badge>
                        <Badge variant="secondary">🇰🇪 Kenya — Coming Soon</Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    <Save className="mr-2 size-4" />
                    {isPending ? "Saving…" : "Save Settings"}
                </Button>
            </div>
        </form>
    );
}
