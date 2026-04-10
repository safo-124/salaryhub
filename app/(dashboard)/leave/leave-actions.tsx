"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/leave";
import { useState } from "react";

export function LeaveActions({
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
        await approveLeaveRequest(id);
        setLoading(false);
        router.refresh();
    }

    async function handleReject() {
        setLoading(true);
        await rejectLeaveRequest(id);
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
