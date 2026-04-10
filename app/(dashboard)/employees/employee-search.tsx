"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function EmployeeSearch({
    currentQuery,
    currentStatus,
}: {
    currentQuery?: string;
    currentStatus?: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function updateParams(key: string, value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        startTransition(() => {
            router.push(`/employees?${params.toString()}`);
        });
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, ID, or department..."
                    defaultValue={currentQuery}
                    className="pl-9"
                    onChange={(e) => {
                        const value = e.target.value;
                        // Debounce: wait 300ms after the user stops typing
                        const timeout = setTimeout(() => updateParams("q", value), 300);
                        return () => clearTimeout(timeout);
                    }}
                />
            </div>
            <Select
                defaultValue={currentStatus || "ALL"}
                onValueChange={(value) => updateParams("status", value === "ALL" ? "" : value ?? "")}
            >
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
            </Select>
            {isPending && (
                <div className="flex items-center text-sm text-muted-foreground">
                    Searching...
                </div>
            )}
        </div>
    );
}
