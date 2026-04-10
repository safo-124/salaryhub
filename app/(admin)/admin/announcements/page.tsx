import { getAnnouncements } from "@/lib/actions/admin";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementActions, CreateAnnouncementForm } from "./actions";

function typeBadge(type: string) {
    switch (type) {
        case "INFO":
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Info</Badge>;
        case "WARNING":
            return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Warning</Badge>;
        case "MAINTENANCE":
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Maintenance</Badge>;
        case "FEATURE":
            return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Feature</Badge>;
        default:
            return <Badge variant="secondary">{type}</Badge>;
    }
}

export default async function AnnouncementsPage() {
    const announcements = await getAnnouncements();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Announcements
                </h1>
                <p className="text-muted-foreground">
                    Broadcast messages to all tenants on the platform.
                </p>
            </div>

            <CreateAnnouncementForm />

            <Card>
                <CardHeader>
                    <CardTitle>All Announcements</CardTitle>
                    <CardDescription>
                        {announcements.length} announcement{announcements.length !== 1 ? "s" : ""} total.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {announcements.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            No announcements yet. Create one above.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-start justify-between gap-4 rounded-lg border p-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{a.title}</p>
                                            {typeBadge(a.type)}
                                            {a.isActive ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{a.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            By {a.createdBy} · {new Date(a.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                                            {a.expiresAt && ` · Expires ${new Date(a.expiresAt).toLocaleDateString("en-GH")}`}
                                        </p>
                                    </div>
                                    <AnnouncementActions id={a.id} isActive={a.isActive} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
