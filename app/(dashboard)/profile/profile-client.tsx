"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { updateOwnProfile, requestOwnLeave } from "@/lib/actions/self-service";

type EmployeeData = {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    department: string | null;
    jobTitle: string | null;
    startDate: string;
    basicSalary: number;
    allowances: number;
    bankName: string | null;
    bankAccount: string | null;
};

type LeaveRequest = {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
};

type PayslipData = {
    id: string;
    period: string;
    netPay: number;
    status: string;
};

type LeaveBalance = {
    type: string;
    entitled: number;
    used: number;
    pending: number;
    carried: number;
    remaining: number;
};

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-destructive/10 text-destructive",
};

const LEAVE_TYPES = [
    "ANNUAL",
    "SICK",
    "MATERNITY",
    "PATERNITY",
    "UNPAID",
    "COMPASSIONATE",
];

export function ProfileClient({
    employee,
    leaveRequests,
    payslips,
    leaveBalances,
}: {
    employee: EmployeeData;
    leaveRequests: LeaveRequest[];
    payslips: PayslipData[];
    leaveBalances: LeaveBalance[];
}) {
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleProfileUpdate(formData: FormData) {
        setLoading(true);
        setError(null);
        const result = await updateOwnProfile(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Profile updated");
            setEditOpen(false);
            router.refresh();
        } else {
            setError(result.error || "Update failed");
        }
    }

    async function handleLeaveRequest(formData: FormData) {
        setLoading(true);
        setError(null);
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        if (startDate && endDate && endDate < startDate) {
            setLoading(false);
            setError("End date must be on or after start date");
            return;
        }
        const result = await requestOwnLeave(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Leave request submitted");
            setLeaveOpen(false);
            router.refresh();
        } else {
            setError(result.error || "Request failed");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">
                        {employee.firstName} {employee.lastName} · {employee.employeeId}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Edit Profile Dialog */}
                    <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); setError(null); }}>
                        <DialogTrigger render={<Button variant="outline" />}>
                            <Pencil className="mr-2 size-4" />
                            Edit Profile
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogDescription>
                                    Update your contact and banking details.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleProfileUpdate} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={employee.phone || ""}
                                        placeholder="+233 XX XXX XXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input
                                        id="bankName"
                                        name="bankName"
                                        defaultValue={employee.bankName || ""}
                                        placeholder="e.g. GCB Bank"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                                    <Input
                                        id="bankAccount"
                                        name="bankAccount"
                                        defaultValue={employee.bankAccount || ""}
                                        placeholder="Account number"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Request Leave Dialog */}
                    <Dialog open={leaveOpen} onOpenChange={(v) => { setLeaveOpen(v); setError(null); }}>
                        <DialogTrigger render={<Button />}>
                            <Plus className="mr-2 size-4" />
                            Request Leave
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Request Leave</DialogTitle>
                                <DialogDescription>
                                    Submit a leave request for yourself.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleLeaveRequest} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Leave Type</Label>
                                    <Select name="type" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEAVE_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t.charAt(0) + t.slice(1).toLowerCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input id="startDate" name="startDate" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input id="endDate" name="endDate" type="date" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason (optional)</Label>
                                    <Input id="reason" name="reason" placeholder="Brief reason for leave" />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Request"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Leave Balances */}
            {leaveBalances.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Balances</CardTitle>
                        <CardDescription>{new Date().getFullYear()} entitlements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {leaveBalances.map((b) => (
                                <div key={b.type} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {b.type.charAt(0) + b.type.slice(1).toLowerCase()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {b.used} used · {b.pending} pending
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">{b.remaining}</p>
                                        <p className="text-xs text-muted-foreground">of {b.entitled + b.carried}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Name" value={`${employee.firstName} ${employee.lastName}`} />
                        <DetailRow label="Email" value={employee.email} />
                        <DetailRow label="Phone" value={employee.phone || "—"} />
                        <DetailRow label="Department" value={employee.department || "—"} />
                        <DetailRow label="Job Title" value={employee.jobTitle || "—"} />
                        <DetailRow label="Start Date" value={employee.startDate} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Compensation</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Basic Salary" value={fmtGHS(employee.basicSalary)} />
                        <DetailRow label="Allowances" value={fmtGHS(employee.allowances)} />
                        <Separator />
                        <DetailRow label="Bank" value={employee.bankName || "—"} />
                        <DetailRow label="Account" value={employee.bankAccount ? `•••${employee.bankAccount.slice(-4)}` : "—"} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Leave Requests</CardTitle>
                        <CardDescription>Your last 5 leave requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leaveRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {leaveRequests.map((lr) => (
                                    <div key={lr.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{lr.type} Leave</p>
                                            <p className="text-xs text-muted-foreground">
                                                {lr.startDate} – {lr.endDate} ({lr.days} days)
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className={statusColors[lr.status] || ""}>
                                            {lr.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payslips</CardTitle>
                        <CardDescription>Your last 5 payslips</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payslips.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payslips yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {payslips.map((ps) => (
                                    <div key={ps.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{ps.period}</p>
                                            <p className="text-xs text-muted-foreground">Net: {fmtGHS(ps.netPay)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className={ps.status === "PAID" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                                                {ps.status.replace("_", " ")}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                render={<a href={`/api/payslips/${ps.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
                                            >
                                                <Download className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
