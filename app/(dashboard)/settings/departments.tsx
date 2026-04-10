"use client";

import { useState } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { createDepartment, updateDepartment, deleteDepartment } from "@/lib/actions/departments";
import { toast } from "sonner";

type Department = {
    id: string;
    name: string;
    headId: string | null;
    employeeCount: number;
    createdAt: string;
};

type Employee = {
    id: string;
    firstName: string;
    lastName: string;
};

export function DepartmentManager({
    departments,
    employees,
}: {
    departments: Department[];
    employees: Employee[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editDept, setEditDept] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate(formData: FormData) {
        setLoading(true);
        const result = await createDepartment(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Department created");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create department");
        }
    }

    async function handleUpdate(formData: FormData) {
        if (!editDept) return;
        setLoading(true);
        const result = await updateDepartment(editDept.id, formData);
        setLoading(false);
        if (result.success) {
            toast.success("Department updated");
            setEditDept(null);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update department");
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete department "${name}"? Employees will be unlinked.`)) return;
        const result = await deleteDepartment(id);
        if (result.success) {
            toast.success("Department deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete");
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Departments</CardTitle>
                        <CardDescription>
                            {departments.length} department{departments.length !== 1 ? "s" : ""}
                        </CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger render={<Button size="sm" />}>
                            <Plus className="mr-2 size-4" />
                            Add Department
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Department</DialogTitle>
                                <DialogDescription>Add a department to your organisation.</DialogDescription>
                            </DialogHeader>
                            <form action={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Engineering" />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating..." : "Create Department"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Building2 className="mb-3 size-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No departments yet. Add your first department above.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Employees</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-medium">{dept.name}</TableCell>
                                    <TableCell className="text-right">{dept.employeeCount}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => setEditDept(dept)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(dept.id, dept.name)}>
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={!!editDept} onOpenChange={(v) => !v && setEditDept(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>Update department details.</DialogDescription>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" name="name" required defaultValue={editDept?.name ?? ""} key={editDept?.id} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Updating..." : "Update Department"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
