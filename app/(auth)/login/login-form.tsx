"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";
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

type LoginState = { error?: string } | undefined;

export default function LoginForm({
    tenantName,
}: {
    tenantName: string | null;
}) {
    const router = useRouter();

    async function loginAction(
        _prev: LoginState,
        formData: FormData
    ): Promise<LoginState> {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            return { error: "Invalid email or password" };
        }

        // Super admin goes to /admin, tenant users go to /
        if (email === "super@salaryhub.com") {
            router.push("/admin");
        } else {
            router.push("/");
        }
        router.refresh();
        return undefined;
    }

    const [state, formAction, isPending] = useActionState(
        loginAction,
        undefined
    );

    const displayName = tenantName ?? "SalaryHub";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <span className="text-xl font-bold text-primary-foreground">
                        {initial}
                    </span>
                </div>
                <CardTitle className="text-2xl font-bold">
                    Welcome to {displayName}
                </CardTitle>
                <CardDescription>
                    {tenantName
                        ? "Sign in to your payroll account"
                        : "Sign in to manage your payroll"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {state.error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Signing in..." : "Sign in"}
                    </Button>
                    {!tenantName && (
                        <>
                            <p className="text-center text-xs text-muted-foreground">
                                Demo: kwame@acmecorp.com / admin123
                            </p>
                            <p className="text-center text-xs text-muted-foreground">
                                Super Admin: super@salaryhub.com / super123
                            </p>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
