"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { createEmployee } from "@/lib/actions/employees";

type FormState = { error?: string; success?: boolean } | undefined;

export function NewEmployeeForm({
    salaryStructures,
    departments,
}: {
    salaryStructures: { id: string; name: string }[];
    departments: { id: string; name: string }[];
}) {
    const router = useRouter();

    async function handleSubmit(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const result = await createEmployee(formData);
        if (result.success) {
            toast.success("Employee created successfully");
            router.push("/employees");
            return { success: true };
        }
        return { error: result.error || "Failed to create employee" };
    }

    const [state, formAction, isPending] = useActionState(
        handleSubmit,
        undefined
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" render={<Link href="/employees" />}>
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Employee</h1>
                    <p className="text-muted-foreground">
                        Enter the new employee&apos;s details.
                    </p>
                </div>
            </div>

            <form action={formAction}>
                {state?.error && (
                    <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {state.error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Basic employee details and contact info.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input id="firstName" name="firstName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input id="lastName" name="lastName" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="+233 XX XXX XXXX" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="departmentId">Department</Label>
                                    <Select name="departmentId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <Input id="jobTitle" name="jobTitle" />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select name="role" defaultValue="EMPLOYEE">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                            <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                                            <SelectItem value="PAYROLL_ADMIN">
                                                Payroll Admin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input id="startDate" name="startDate" type="date" required />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Salary & Banking</CardTitle>
                            <CardDescription>
                                Compensation details and bank information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {salaryStructures.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="salaryStructureId">Salary Structure</Label>
                                    <Select name="salaryStructureId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (manual)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {salaryStructures.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="basicSalary">Basic Salary (GHS) *</Label>
                                    <Input
                                        id="basicSalary"
                                        name="basicSalary"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="allowances">Allowances (GHS)</Label>
                                    <Input
                                        id="allowances"
                                        name="allowances"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue="0"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" name="bankName" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccount">Account Number</Label>
                                    <Input id="bankAccount" name="bankAccount" />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ssnit">SSNIT Number</Label>
                                    <Input
                                        id="ssnit"
                                        name="ssnit"
                                        placeholder="C/XXXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tin">TIN</Label>
                                    <Input id="tin" name="tin" placeholder="CXXXXXXXXXX" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" render={<Link href="/employees" />}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Add Employee"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
