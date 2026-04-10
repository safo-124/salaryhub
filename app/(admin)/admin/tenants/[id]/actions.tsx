"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateTenantStatus, updateTenantPlan, deleteTenant, generateImpersonationToken } from "@/lib/actions/admin";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";

export function TenantActions({
    tenantId,
    currentStatus,
    currentPlan,
}: {
    tenantId: string;
    currentStatus: string;
    currentPlan: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function handleStatusChange(status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") {
        setLoading(true);
        const result = await updateTenantStatus(tenantId, status);
        setLoading(false);
        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success(`Tenant status updated to ${status}`);
            router.refresh();
        }
    }

    async function handlePlanChange(plan: string | null) {
        if (!plan) return;
        setLoading(true);
        const result = await updateTenantPlan(
            tenantId,
            plan as "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
        );
        setLoading(false);
        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success(`Tenant plan updated to ${plan}`);
            router.refresh();
        }
    }

    async function handleImpersonate() {
        setLoading(true);
        const result = await generateImpersonationToken(tenantId);
        if ("error" in result) {
            toast.error(result.error);
            setLoading(false);
            return;
        }

        await signIn("credentials", {
            impersonationToken: result.token,
            redirect: true,
            callbackUrl: "/",
        });
    }

    async function handleDelete() {
        setLoading(true);
        const result = await deleteTenant(tenantId);
        setLoading(false);
        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success("Tenant deleted");
            router.push("/admin/tenants");
        }
    }

    return (
        <div className="space-y-6">
            {/* Impersonate */}
            <div>
                <h3 className="text-sm font-medium mb-3">Impersonation</h3>
                <p className="text-xs text-muted-foreground mb-3">
                    Login as this tenant&apos;s owner to view their dashboard. A banner will show at the top.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImpersonate}
                    disabled={loading || currentStatus !== "ACTIVE"}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                    <Eye className="mr-2 size-4" />
                    Impersonate Owner
                </Button>
            </div>

            <Separator />

            {/* Status Management */}
            <div>
                <h3 className="text-sm font-medium mb-3">Status Management</h3>
                <div className="flex flex-wrap gap-3">
                    {currentStatus !== "ACTIVE" && (
                        <Button
                            size="sm"
                            onClick={() => handleStatusChange("ACTIVE")}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Activate
                        </Button>
                    )}
                    {currentStatus !== "SUSPENDED" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange("SUSPENDED")}
                            disabled={loading}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                            Suspend
                        </Button>
                    )}
                    {currentStatus !== "DEACTIVATED" && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange("DEACTIVATED")}
                            disabled={loading}
                        >
                            Deactivate
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            {/* Plan Management */}
            <div>
                <h3 className="text-sm font-medium mb-3">Plan Management</h3>
                <div className="flex items-center gap-3">
                    <Select defaultValue={currentPlan} onValueChange={handlePlanChange}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STARTER">Starter (≤25 employees)</SelectItem>
                            <SelectItem value="PROFESSIONAL">Professional (≤100)</SelectItem>
                            <SelectItem value="ENTERPRISE">Enterprise (≤500)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
                <h3 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h3>
                {!confirmDelete ? (
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDelete(true)}
                        disabled={loading}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete Tenant
                    </Button>
                ) : (
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-destructive">Are you sure? This cannot be undone.</p>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Confirm Delete"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
