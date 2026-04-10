"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createTenant } from "@/lib/actions/admin";

type FormState = { error?: string; success?: boolean } | undefined;

export default function NewTenantPage() {
    const router = useRouter();

    async function createAction(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;
        const country = formData.get("country") as string;
        const plan = formData.get("plan") as string;
        const ownerName = formData.get("ownerName") as string;
        const ownerEmail = formData.get("ownerEmail") as string;

        if (!name || !slug || !country || !plan || !ownerName || !ownerEmail) {
            return { error: "All fields are required" };
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return { error: "Slug must contain only lowercase letters, numbers, and hyphens" };
        }

        const result = await createTenant({
            name,
            slug,
            country,
            plan: plan as "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
            ownerName,
            ownerEmail,
        });

        if ("error" in result) {
            return { error: result.error as string };
        }

        router.push("/admin/tenants");
        router.refresh();
        return { success: true };
    }

    const [state, formAction, isPending] = useActionState(createAction, undefined);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" render={<Link href="/admin/tenants" />}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Tenant</h1>
                    <p className="text-muted-foreground">
                        Register a new organization on the platform.
                    </p>
                </div>
            </div>

            <form action={formAction}>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Organization Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>Basic information about the tenant.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {state?.error && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                    {state.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Acme Corporation"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Subdomain Slug</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="slug"
                                        name="slug"
                                        placeholder="acme"
                                        required
                                        pattern="[a-z0-9-]+"
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        .salaryhub.com
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select name="country" defaultValue="GH">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GH">Ghana 🇬🇭</SelectItem>
                                        <SelectItem value="NG">Nigeria 🇳🇬</SelectItem>
                                        <SelectItem value="KE">Kenya 🇰🇪</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan">Plan</Label>
                                <Select name="plan" defaultValue="STARTER">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STARTER">Starter (≤25 employees)</SelectItem>
                                        <SelectItem value="PROFESSIONAL">Professional (≤100 employees)</SelectItem>
                                        <SelectItem value="ENTERPRISE">Enterprise (≤500 employees)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Owner Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Owner Account</CardTitle>
                            <CardDescription>
                                Primary administrator for this organization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ownerName">Full Name</Label>
                                <Input
                                    id="ownerName"
                                    name="ownerName"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ownerEmail">Email Address</Label>
                                <Input
                                    id="ownerEmail"
                                    name="ownerEmail"
                                    type="email"
                                    placeholder="john@acme.com"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        render={<Link href="/admin/tenants" />}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create Tenant"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
