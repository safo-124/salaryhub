"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus } from "lucide-react";
import { createLeaveRequest } from "@/lib/actions/leave";
import { toast } from "sonner";

export function NewLeaveForm({
    employees,
}: {
    employees: { id: string; firstName: string; lastName: string }[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        if (startDate && endDate && endDate < startDate) {
            setLoading(false);
            setError("End date must be on or after start date");
            return;
        }

        const result = await createLeaveRequest(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Leave request submitted");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create leave request");
            setError(result.error || "Failed to create leave request");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
                <Plus className="mr-2 size-4" />
                New Leave Request
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Leave Request</DialogTitle>
                    <DialogDescription>
                        Submit a leave request for an employee.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee</Label>
                        <Select name="employeeId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Leave Type</Label>
                        <Select name="type" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANNUAL">Annual</SelectItem>
                                <SelectItem value="SICK">Sick</SelectItem>
                                <SelectItem value="MATERNITY">Maternity</SelectItem>
                                <SelectItem value="PATERNITY">Paternity</SelectItem>
                                <SelectItem value="UNPAID">Unpaid</SelectItem>
                                <SelectItem value="COMPASSIONATE">Compassionate</SelectItem>
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
                        <Input id="reason" name="reason" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
