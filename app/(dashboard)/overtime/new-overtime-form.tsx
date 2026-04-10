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
import { createOvertimeEntry } from "@/lib/actions/overtime";

export function NewOvertimeForm({
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
        const result = await createOvertimeEntry(formData);
        setLoading(false);
        if (result.success) {
            setOpen(false);
            router.refresh();
        } else {
            setError(result.error || "Failed to log overtime");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
                <Plus className="mr-2 size-4" />
                Log Overtime
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Overtime</DialogTitle>
                    <DialogDescription>
                        Record overtime hours for an employee.
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
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="clockIn">Clock In</Label>
                            <Input id="clockIn" name="clockIn" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clockOut">Clock Out</Label>
                            <Input id="clockOut" name="clockOut" type="datetime-local" required />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="breakMinutes">Break (minutes)</Label>
                            <Input
                                id="breakMinutes"
                                name="breakMinutes"
                                type="number"
                                min="0"
                                defaultValue="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate">Rate Multiplier</Label>
                            <Select name="rate" defaultValue="1.5">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5">1.5x (Standard)</SelectItem>
                                    <SelectItem value="2.0">2.0x (Weekend)</SelectItem>
                                    <SelectItem value="2.5">2.5x (Holiday)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Input id="notes" name="notes" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Logging..." : "Log Overtime"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
