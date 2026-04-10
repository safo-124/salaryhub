import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTenantSettings } from "@/lib/actions/settings";
import { SettingsForm } from "./settings-form";

const planColors: Record<string, string> = {
    STARTER: "bg-muted text-muted-foreground",
    PROFESSIONAL: "bg-primary/10 text-primary",
    ENTERPRISE: "bg-warning/10 text-warning",
};

export default async function SettingsPage() {
    const settings = await getTenantSettings();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your organisation settings.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Organisation</CardTitle>
                        <CardDescription>
                            Your organisation details. Contact super admin to change plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailRow label="Name" value={settings.name} />
                        <DetailRow label="Slug" value={settings.slug} />
                        <DetailRow label="Country" value={settings.country} />
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Plan</span>
                            <Badge variant="secondary" className={planColors[settings.plan]}>
                                {settings.plan}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge
                                variant="secondary"
                                className="bg-success/10 text-success"
                            >
                                {settings.status}
                            </Badge>
                        </div>
                        <Separator />
                        <DetailRow
                            label="Employees"
                            value={`${settings.employeeCount} / ${settings.maxEmployees}`}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing</CardTitle>
                        <CardDescription>
                            Set a billing contact email for invoices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsForm billingEmail={settings.billingEmail ?? ""} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
