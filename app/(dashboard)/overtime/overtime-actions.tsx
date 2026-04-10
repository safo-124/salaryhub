"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { approveOvertimeEntry, rejectOvertimeEntry } from "@/lib/actions/overtime";
import { useState } from "react";

export function OvertimeActions({
    id,
    status,
}: {
    id: string;
    status: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (status !== "PENDING") return null;

    async function handleApprove() {
        setLoading(true);
        await approveOvertimeEntry(id);
        setLoading(false);
        router.refresh();
    }

    async function handleReject() {
        setLoading(true);
        await rejectOvertimeEntry(id);
        setLoading(false);
        router.refresh();
    }

    return (
        <div className="flex gap-1">
            <Button
                size="sm"
                variant="ghost"
                onClick={handleApprove}
                disabled={loading}
            >
                <CheckCircle className="size-4 text-green-600" />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={handleReject}
                disabled={loading}
            >
                <XCircle className="size-4 text-red-600" />
            </Button>
        </div>
    );
}
