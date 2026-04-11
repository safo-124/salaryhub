"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import {
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from "@/lib/actions/departments";

type Department = {
    id: string;
    name: string;
    headId: string | null;
    employeeCount: number;
    createdAt: string;
};

type Employee = {
    id: string;
    name: string;
};

type FormState = { error?: string; success?: boolean } | undefined;

export function DepartmentList({
    departments,
    employees,
}: {
    departments: Department[];
    employees: Employee[];
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editDept, setEditDept] = useState<Department | null>(null);

    async function handleCreate(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        const result = await createDepartment(formData);
        if (result.success) {
            toast.success("Department created");
            setCreateOpen(false);
            return { success: true };
        }
        return { error: result.error };
    }

    async function handleUpdate(
        _prev: FormState,
        formData: FormData
    ): Promise<FormState> {
        if (!editDept) return { error: "No department selected" };
        const result = await updateDepartment(editDept.id, formData);
        if (result.success) {
            toast.success("Department updated");
            setEditDept(null);
            return { success: true };
        }
        return { error: result.error };
    }

    async function handleDelete(dept: Department) {
        if (!confirm(`Delete "${dept.name}"? Employees in this department will be unassigned.`))
            return;
        const result = await deleteDepartment(dept.id);
        if (result.success) {
            toast.success("Department deleted");
        } else {
            toast.error(result.error || "Failed to delete department");
        }
    }

    const [createState, createAction, createPending] = useActionState(
        handleCreate,
        undefined
    );
    const [editState, editAction, editPending] = useActionState(
        handleUpdate,
        undefined
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>All Departments</CardTitle>
                    <CardDescription>
                        {departments.length} department{departments.length !== 1 ? "s" : ""}
                    </CardDescription>
                </div>

                {/* Create Department Dialog */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger render={<Button size="sm" />}>
                        <Plus className="mr-2 size-4" />
                        Add Department
                    </DialogTrigger>
                    <DialogContent>
                        <form action={createAction}>
                            <DialogHeader>
                                <DialogTitle>New Department</DialogTitle>
                                <DialogDescription>
                                    Create a new department for your organisation.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {createState?.error && (
                                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                        {createState.error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="create-name">Department Name *</Label>
                                    <Input
                                        id="create-name"
                                        name="name"
                                        placeholder="e.g. Engineering, Finance, HR"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="create-head">Department Head</Label>
                                    <Select name="headId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select head (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((e) => (
                                                <SelectItem key={e.id} value={e.id}>
                                                    {e.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createPending}>
                                    {createPending ? "Creating..." : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent>
                {departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="mb-4 size-12 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold">No departments yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first department to organise employees.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Head</TableHead>
                                <TableHead className="text-center">Employees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((dept) => {
                                const head = dept.headId
                                    ? employees.find((e) => e.id === dept.headId)
                                    : null;
                                return (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">
                                            {dept.name}
                                        </TableCell>
                                        <TableCell>
                                            {head ? head.name : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {dept.employeeCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditDept(dept)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(dept)}
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Edit Department Dialog */}
            <Dialog open={!!editDept} onOpenChange={(o) => !o && setEditDept(null)}>
                <DialogContent>
                    <form action={editAction}>
                        <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                            <DialogDescription>
                                Update department details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {editState?.error && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                    {editState.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Department Name *</Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    defaultValue={editDept?.name}
                                    key={editDept?.id}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-head">Department Head</Label>
                                <Select
                                    name="headId"
                                    defaultValue={editDept?.headId || undefined}
                                    key={editDept?.id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select head (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>
                                                {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditDept(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editPending}>
                                {editPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
