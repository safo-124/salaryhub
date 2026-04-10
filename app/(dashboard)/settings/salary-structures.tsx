"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { createSalaryStructure, deleteSalaryStructure } from "@/lib/actions/salary-structures";
import { toast } from "sonner";

type Component = { name: string; type: "earning" | "deduction"; calcType: "fixed" | "percentage"; value: number };
type Structure = { id: string; name: string; components: Component[]; createdAt: string };

export function SalaryStructureManager({ structures }: { structures: Structure[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [components, setComponents] = useState<Component[]>([
        { name: "", type: "earning", calcType: "fixed", value: 0 },
    ]);
    const [loading, setLoading] = useState(false);

    function addComponent() {
        setComponents([...components, { name: "", type: "earning", calcType: "fixed", value: 0 }]);
    }

    function removeComponent(index: number) {
        setComponents(components.filter((_, i) => i !== index));
    }

    function updateComponent(index: number, field: keyof Component, value: string | number) {
        const updated = [...components];
        (updated[index] as Record<string, unknown>)[field] = value;
        setComponents(updated);
    }

    async function handleCreate() {
        const validComponents = components.filter((c) => c.name.trim());
        if (!name.trim() || validComponents.length === 0) {
            toast.error("Name and at least one named component are required");
            return;
        }
        setLoading(true);
        const result = await createSalaryStructure(name, validComponents);
        setLoading(false);
        if (result.success) {
            toast.success("Salary structure created");
            setOpen(false);
            setName("");
            setComponents([{ name: "", type: "earning", calcType: "fixed", value: 0 }]);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create");
        }
    }

    async function handleDelete(id: string, structName: string) {
        if (!confirm(`Delete salary structure "${structName}"?`)) return;
        const result = await deleteSalaryStructure(id);
        if (result.success) {
            toast.success("Deleted");
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
                        <CardTitle>Salary Structure Templates</CardTitle>
                        <CardDescription>{structures.length} template{structures.length !== 1 ? "s" : ""}</CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger render={<Button size="sm" />}>
                            <Plus className="mr-2 size-4" />
                            New Template
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>New Salary Structure</DialogTitle>
                                <DialogDescription>Define a reusable salary structure template with earnings and deductions.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Template Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Employee" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Components</Label>
                                    {components.map((comp, i) => (
                                        <div key={i} className="flex gap-2 items-end">
                                            <Input
                                                className="flex-1"
                                                placeholder="Component name"
                                                value={comp.name}
                                                onChange={(e) => updateComponent(i, "name", e.target.value)}
                                            />
                                            <Select value={comp.type} onValueChange={(v) => updateComponent(i, "type", v ?? "earning")}>
                                                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="earning">Earning</SelectItem>
                                                    <SelectItem value="deduction">Deduction</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={comp.calcType} onValueChange={(v) => updateComponent(i, "calcType", v ?? "fixed")}>
                                                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fixed">Fixed</SelectItem>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                className="w-[100px]"
                                                type="number"
                                                value={comp.value}
                                                onChange={(e) => updateComponent(i, "value", parseFloat(e.target.value) || 0)}
                                            />
                                            {components.length > 1 && (
                                                <Button size="icon" variant="ghost" onClick={() => removeComponent(i)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button size="sm" variant="outline" onClick={addComponent}>
                                        <Plus className="mr-1 size-3" /> Add Component
                                    </Button>
                                </div>
                                <Button className="w-full" onClick={handleCreate} disabled={loading}>
                                    {loading ? "Creating..." : "Create Template"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {structures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <DollarSign className="mb-3 size-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No salary templates yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {structures.map((s) => (
                            <div key={s.id} className="rounded-lg border p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold">{s.name}</h3>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id, s.name)}>
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {s.components.map((c, i) => (
                                        <Badge key={i} variant="secondary" className={c.type === "earning" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                                            {c.name}: {c.calcType === "percentage" ? `${c.value}%` : `GHS ${c.value}`}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
