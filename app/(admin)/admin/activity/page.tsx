import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/admin";

function actionBadge(action: string) {
    if (action.includes("CREATED") || action.includes("SEEDED"))
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Create</Badge>;
    if (action.includes("SUSPENDED"))
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Warning</Badge>;
    if (action.includes("DEACTIVATED") || action.includes("DELETED"))
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Destructive</Badge>;
    if (action.includes("ACTIVE"))
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Success</Badge>;
    if (action.includes("CHANGED") || action.includes("UPDATED"))
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Update</Badge>;
    if (action.includes("IMPERSONAT"))
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Impersonate</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
}

export default async function ActivityLogPage({
    searchParams,
}: {
    searchParams: Promise<{ action?: string }>;
}) {
    const { action } = await searchParams;
    const logs = await getAuditLogs(100, action);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground">
                    Audit trail of all platform-level actions.
                </p>
            </div>

            {/* Filter */}
            <form className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        name="action"
                        placeholder="Filter by action (e.g. TENANT, ADMIN, SETTINGS)…"
                        defaultValue={action ?? ""}
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="outline" size="sm">
                    Filter
                </Button>
                {action && (
                    <Button variant="ghost" size="sm" render={<a href="/admin/activity" />}>
                        Clear
                    </Button>
                )}
            </form>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        {logs.length} action{logs.length !== 1 ? "s" : ""} recorded.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            No activity recorded yet. Actions will appear here as you manage the platform.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Performed By</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">
                                            {entry.action.replace(/_/g, " ")}
                                        </TableCell>
                                        <TableCell>{entry.target}</TableCell>
                                        <TableCell>{actionBadge(entry.action)}</TableCell>
                                        <TableCell className="text-sm">{entry.actorName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(entry.createdAt).toLocaleString("en-GH", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
