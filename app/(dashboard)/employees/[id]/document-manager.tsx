"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument, deleteDocument } from "@/lib/actions/documents";

type Doc = {
    id: string;
    name: string;
    type: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: string;
};

const DOC_TYPES = [
    { value: "CONTRACT", label: "Contract" },
    { value: "ID_DOCUMENT", label: "ID Document" },
    { value: "TAX_FORM", label: "Tax Form" },
    { value: "OFFER_LETTER", label: "Offer Letter" },
    { value: "CERTIFICATION", label: "Certification" },
    { value: "OTHER", label: "Other" },
];

const typeColors: Record<string, string> = {
    CONTRACT: "bg-primary/10 text-primary",
    ID_DOCUMENT: "bg-info/10 text-info",
    TAX_FORM: "bg-warning/10 text-warning",
    OFFER_LETTER: "bg-success/10 text-success",
    CERTIFICATION: "bg-accent text-accent-foreground",
    OTHER: "bg-muted text-muted-foreground",
};

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentManager({
    employeeId,
    documents,
}: {
    employeeId: string;
    documents: Doc[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    async function handleUpload(formData: FormData) {
        formData.set("employeeId", employeeId);
        setLoading(true);
        const result = await uploadDocument(formData);
        setLoading(false);
        if (result.success) {
            toast.success("Document uploaded");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || "Upload failed");
        }
    }

    async function handleDelete(docId: string) {
        setDeleting(docId);
        const result = await deleteDocument(docId);
        setDeleting(null);
        if (result.success) {
            toast.success("Document deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Delete failed");
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                        {documents.length === 0
                            ? "No documents uploaded yet."
                            : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
                    </CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={<Button size="sm" />}>
                        <Upload className="mr-2 size-4" />
                        Upload
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>
                                Upload a document for this employee. Max 5MB. PDF, images, or Word.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Document Name</Label>
                                <Input id="name" name="name" required placeholder="e.g. Employment Contract 2026" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Document Type</Label>
                                <Select name="type" defaultValue="OTHER">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOC_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">File</Label>
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    required
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Uploading..." : "Upload Document"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No documents yet. Upload contracts, IDs, tax forms, and more.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="size-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.fileName} · {formatSize(doc.fileSize)} · {doc.uploadedBy}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={typeColors[doc.type] || ""}
                                    >
                                        {doc.type.replace("_", " ")}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        render={
                                            <a
                                                href={`/api/documents/${doc.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            />
                                        }
                                    >
                                        <ExternalLink className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        disabled={deleting === doc.id}
                                        onClick={() => handleDelete(doc.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
