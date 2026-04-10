"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard } from "lucide-react";
import { approvePayroll, markPayrollPaid } from "@/lib/actions/payroll";
import { useState } from "react";

export function PayrollActions({
    id,
    status,
}: {
    id: string;
    status: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleApprove() {
        setLoading(true);
        await approvePayroll(id);
        setLoading(false);
        router.refresh();
    }

    async function handleMarkPaid() {
        setLoading(true);
        await markPayrollPaid(id);
        setLoading(false);
        router.refresh();
    }

    if (status === "PENDING_APPROVAL") {
        return (
            <Button onClick={handleApprove} disabled={loading}>
                <CheckCircle className="mr-2 size-4" />
                {loading ? "Approving..." : "Approve Payroll"}
            </Button>
        );
    }

    if (status === "APPROVED") {
        return (
            <Button onClick={handleMarkPaid} disabled={loading}>
                <CreditCard className="mr-2 size-4" />
                {loading ? "Processing..." : "Mark as Paid"}
            </Button>
        );
    }

    return null;
}
