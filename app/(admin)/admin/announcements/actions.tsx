"use client";

import { useActionState, useState, useTransition } from "react";
import {
    createAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
} from "@/lib/actions/admin";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Power, Trash2 } from "lucide-react";

async function handleCreate(
    _prev: { success?: boolean; error?: string } | null,
    formData: FormData
) {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as string;
    const expiresAt = formData.get("expiresAt") as string;

    if (!title || !content || !type) {
        return { error: "Title, content, and type are required" };
    }

    return createAnnouncement({
        title,
        content,
        type,
        expiresAt: expiresAt || undefined,
    });
}

export function CreateAnnouncementForm() {
    const [state, formAction, isPending] = useActionState(handleCreate, null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Announcement</CardTitle>
                <CardDescription>Create a platform-wide announcement.</CardDescription>
            </CardHeader>
            <CardContent>
                {state && "success" in state && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                        Announcement created.
                    </div>
                )}
                {state && "error" in state && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {state.error}
                    </div>
                )}
                <form action={formAction} className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" required placeholder="Scheduled maintenance" />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="type">Type</Label>
                        <select
                            id="type"
                            name="type"
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="FEATURE">Feature</option>
                        </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="content">Content</Label>
                        <Input id="content" name="content" required placeholder="Describe the announcement…" />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="expiresAt">Expires At (optional)</Label>
                        <Input id="expiresAt" name="expiresAt" type="date" />
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" disabled={isPending}>
                            <Plus className="mr-2 size-4" />
                            {isPending ? "Creating…" : "Create Announcement"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export function AnnouncementActions({
    id,
    isActive,
}: {
    id: string;
    isActive: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                    startTransition(async () => {
                        await toggleAnnouncement(id);
                    })
                }
                title={isActive ? "Deactivate" : "Activate"}
            >
                <Power className="size-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                    startTransition(async () => {
                        await deleteAnnouncement(id);
                    })
                }
                className="text-red-600 hover:text-red-700"
                title="Delete"
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}
