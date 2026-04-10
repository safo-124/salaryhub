import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ClipboardList } from "lucide-react";
import { getTenantAuditLogs } from "@/lib/actions/audit";

const actionColors: Record<string, string> = {
    CREATE: "bg-success/10 text-success",
    UPDATE: "bg-info/10 text-info",
    DELETE: "bg-destructive/10 text-destructive",
    APPROVE: "bg-primary/10 text-primary",
    REJECT: "bg-warning/10 text-warning",
};

function getActionColor(action: string) {
    for (const [key, color] of Object.entries(actionColors)) {
        if (action.toUpperCase().includes(key)) return color;
    }
    return "bg-muted text-muted-foreground";
}

export default async function AuditPage() {
    const logs = await getTenantAuditLogs();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
                <p className="text-muted-foreground">
                    Track all actions performed in your organisation.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                    <CardDescription>
                        {logs.length === 0
                            ? "No activity recorded yet."
                            : `${logs.length} event${logs.length !== 1 ? "s" : ""} recorded.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ClipboardList className="mb-4 size-12 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium">No audit events yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Actions will appear here as you use the system.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <Badge variant="secondary" className={getActionColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{log.target}</div>
                                            {log.targetId && (
                                                <div className="text-xs text-muted-foreground font-mono">{log.targetId}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>{log.actorName}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString()}
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
