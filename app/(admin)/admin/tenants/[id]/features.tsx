"use client";

import { useTransition } from "react";
import { toggleTenantFeature } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function TenantFeatureToggles({
    tenantId,
    features,
    availableFeatures,
}: {
    tenantId: string;
    features: Record<string, { enabled: boolean; enabledAt: string | null; enabledBy: string | null }>;
    availableFeatures: { key: string; label: string; description: string }[];
}) {
    const [isPending, startTransition] = useTransition();

    function handleToggle(feature: string, enabled: boolean) {
        startTransition(async () => {
            const result = await toggleTenantFeature(tenantId, feature, enabled);
            if ("error" in result) {
                toast.error(String(result.error));
            } else {
                toast.success(`${feature} ${enabled ? "enabled" : "disabled"}`);
            }
        });
    }

    return (
        <div className="space-y-1 divide-y">
            {availableFeatures.map((f) => {
                const state = features[f.key];
                const isEnabled = state?.enabled ?? false;

                return (
                    <div key={f.key} className="flex items-center justify-between py-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{f.label}</p>
                                {isEnabled ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-xs">Off</Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                            {state?.enabledAt && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Enabled {new Date(state.enabledAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                                    {state.enabledBy && ` by ${state.enabledBy}`}
                                </p>
                            )}
                        </div>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggle(f.key, checked)}
                            disabled={isPending}
                        />
                    </div>
                );
            })}
        </div>
    );
}
