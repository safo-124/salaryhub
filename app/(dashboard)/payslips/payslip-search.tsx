"use client";

import { useRouter } from "next/navigation";
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

export function PayslipSearch({
    currentQuery,
    currentPeriod,
    periods,
}: {
    currentQuery?: string;
    currentPeriod?: string;
    periods: string[];
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
            router.push(`/payslips?${params.toString()}`);
        });
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by employee name or ID..."
                    defaultValue={currentQuery}
                    className="pl-9"
                    onChange={(e) => {
                        const value = e.target.value;
                        const timeout = setTimeout(() => updateParams("q", value), 300);
                        return () => clearTimeout(timeout);
                    }}
                />
            </div>
            {periods.length > 0 && (
                <Select
                    defaultValue={currentPeriod || "ALL"}
                    onValueChange={(value) => updateParams("period", value === "ALL" ? "" : value ?? "")}
                >
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="All periods" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Periods</SelectItem>
                        {periods.map((p) => (
                            <SelectItem key={p} value={p}>
                                {p}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {isPending && (
                <div className="flex items-center text-sm text-muted-foreground">
                    Searching...
                </div>
            )}
        </div>
    );
}
