"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { updateEmployeeStatus } from "@/lib/actions/employees";
import { toast } from "sonner";

const statuses = [
    { value: "ACTIVE", label: "Active", color: "text-green-600" },
    { value: "ON_LEAVE", label: "On Leave", color: "text-yellow-600" },
    { value: "SUSPENDED", label: "Suspended", color: "text-red-600" },
    { value: "TERMINATED", label: "Terminated", color: "text-muted-foreground" },
] as const;

export function StatusToggle({ id, currentStatus }: { id: string; currentStatus: string }) {
    const router = useRouter();

    async function handleChange(status: string) {
        if (status === currentStatus) return;
        const result = await updateEmployeeStatus(id, status as "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED");
        if (result.success) {
            toast.success(`Status changed to ${status.replace("_", " ")}`);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update status");
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
                <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {statuses.map((s) => (
                    <DropdownMenuItem
                        key={s.value}
                        onClick={() => handleChange(s.value)}
                        disabled={s.value === currentStatus}
                    >
                        <span className={`mr-2 size-2 rounded-full inline-block ${s.value === "ACTIVE" ? "bg-green-500" :
                                s.value === "ON_LEAVE" ? "bg-yellow-500" :
                                    s.value === "SUSPENDED" ? "bg-red-500" :
                                        "bg-gray-400"
                            }`} />
                        {s.label}
                        {s.value === currentStatus && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
