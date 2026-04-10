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
import { createAdmin } from "@/lib/actions/admin";

type FormState = { error?: string; success?: boolean } | undefined;

export default function NewAdminPage() {
    const router = useRouter();

    async function createAction(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const role = formData.get("role") as string;

        if (!name || !email || !password || !role) {
            return { error: "All fields are required" };
        }

        if (password.length < 8) {
            return { error: "Password must be at least 8 characters" };
        }

        const result = await createAdmin({
            name,
            email,
            password,
            role: role as "SUPER_ADMIN" | "SUPPORT",
        });

        if ("error" in result) {
            return { error: result.error as string };
        }

        router.push("/admin/users");
        router.refresh();
        return { success: true };
    }

    const [state, formAction, isPending] = useActionState(createAction, undefined);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" render={<Link href="/admin/users" />}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Admin</h1>
                    <p className="text-muted-foreground">
                        Create a new platform admin or support account.
                    </p>
                </div>
            </div>

            <form action={formAction}>
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>Admin Account</CardTitle>
                        <CardDescription>
                            This user will have platform-level access to SalaryHub.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {state.error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="john@salaryhub.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" placeholder="Min 8 characters" required minLength={8} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" defaultValue="SUPPORT">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    <SelectItem value="SUPPORT">Support</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" render={<Link href="/admin/users" />}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating..." : "Create Admin"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
