import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { getEmployee, getEmployeeOnboarding } from "@/lib/actions/employees";
import { OnboardingChecklist } from "./onboarding-checklist";

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [employee, onboarding] = await Promise.all([
        getEmployee(id),
        getEmployeeOnboarding(id),
    ]);

    if (!employee) notFound();

    const statusColors: Record<string, string> = {
        ACTIVE: "bg-success/10 text-success",
        ON_LEAVE: "bg-warning/10 text-warning",
        SUSPENDED: "bg-destructive/10 text-destructive",
        TERMINATED: "bg-muted text-muted-foreground",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" render={<Link href="/employees" />}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {employee.firstName} {employee.lastName}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={statusColors[employee.status] || ""}
                            >
                                {employee.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {employee.employeeId} · {employee.jobTitle || "No title"}
                        </p>
                    </div>
                </div>
                <Button render={<Link href={`/employees/${id}/edit`} />}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailRow label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                        <DetailRow label="Email" value={employee.email} />
                        <DetailRow label="Phone" value={employee.phone || "—"} />
                        <DetailRow label="Department" value={employee.department || "—"} />
                        <DetailRow label="Job Title" value={employee.jobTitle || "—"} />
                        <DetailRow label="Role" value={employee.role.replace("_", " ")} />
                        <DetailRow label="Start Date" value={employee.startDate} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Salary & Banking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailRow
                            label="Basic Salary"
                            value={`GHS ${employee.basicSalary.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
                        />
                        <DetailRow
                            label="Allowances"
                            value={`GHS ${employee.allowances.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
                        />
                        <Separator />
                        <DetailRow label="Bank" value={employee.bankName || "—"} />
                        <DetailRow label="Account" value={employee.bankAccount || "—"} />
                        <Separator />
                        <DetailRow label="SSNIT Number" value={employee.ssnit || "—"} />
                        <DetailRow label="TIN" value={employee.tin || "—"} />
                    </CardContent>
                </Card>
            </div>

            {onboarding && <OnboardingChecklist onboarding={onboarding} />}
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
