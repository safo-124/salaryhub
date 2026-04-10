"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportButton({
    exportFn,
    filename,
    label = "Export CSV",
}: {
    exportFn: () => Promise<string>;
    filename: string;
    label?: string;
}) {
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);
        try {
            const csv = await exportFn();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Export downloaded");
        } catch {
            toast.error("Export failed");
        }
        setLoading(false);
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="mr-2 size-4" />
            {loading ? "Exporting..." : label}
        </Button>
    );
}
