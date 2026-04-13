"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { importEmployeesCSV, getCSVTemplate } from "@/lib/actions/import-employees";
import { toast } from "sonner";

export function ImportEmployeesDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        created?: number;
        error?: string;
        errors?: string[];
    } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleDownloadTemplate() {
        const csv = await getCSVTemplate();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "employee-import-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleImport() {
        if (!file) return;
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        const res = await importEmployeesCSV(formData);
        setLoading(false);
        setResult(res);

        if (res.success && !res.errors?.length) {
            toast.success(`Successfully imported ${res.created} employee(s)`);
            setTimeout(() => {
                setOpen(false);
                setFile(null);
                setResult(null);
                router.refresh();
            }, 1500);
        } else if (res.success && res.errors?.length) {
            toast.warning(`Imported ${res.created} with ${res.errors.length} error(s)`);
        }
    }

    function handleOpenChange(o: boolean) {
        setOpen(o);
        if (!o) {
            setFile(null);
            setResult(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <Upload className="mr-2 size-4" />
                Import CSV
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Employees from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with employee data. Download the template for the correct format.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="w-full"
                    >
                        <Download className="mr-2 size-4" />
                        Download CSV Template
                    </Button>

                    <div
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileRef.current?.click()}
                    >
                        <FileSpreadsheet className="mb-3 size-10 text-muted-foreground" />
                        {file ? (
                            <div className="text-center">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm font-medium">Click to select CSV file</p>
                                <p className="text-xs text-muted-foreground">
                                    Max 2MB, .csv format
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                                setFile(e.target.files?.[0] || null);
                                setResult(null);
                            }}
                        />
                    </div>

                    {result && (
                        <div
                            className={`rounded-lg p-3 text-sm ${result.success && !result.errors?.length
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                        >
                            {result.success && !result.errors?.length ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>Successfully imported {result.created} employee(s)!</span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span className="font-medium">
                                            {result.success
                                                ? `Partially imported: ${result.created} created`
                                                : "Import failed"}
                                        </span>
                                    </div>
                                    {result.error && (
                                        <pre className="mt-1 whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
                                            {result.error}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || loading}
                    >
                        {loading ? "Importing..." : "Import Employees"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
