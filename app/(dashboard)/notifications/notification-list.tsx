"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { toast } from "sonner";
import Link from "next/link";

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: string;
};

const typeIcons: Record<string, string> = {
    LEAVE_REQUEST: "📋",
    LEAVE_APPROVED: "✅",
    LEAVE_REJECTED: "❌",
    OVERTIME_SUBMITTED: "⏰",
    OVERTIME_APPROVED: "✅",
    OVERTIME_REJECTED: "❌",
    PAYROLL_READY: "💰",
    PAYROLL_APPROVED: "✅",
    PAYROLL_PAID: "🏦",
    EMPLOYEE_ONBOARDED: "👋",
    GENERAL: "📢",
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
    const router = useRouter();
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    async function handleMarkAllRead() {
        await markAllAsRead();
        toast.success("All notifications marked as read");
        router.refresh();
    }

    async function handleMarkRead(id: string) {
        await markAsRead(id);
        router.refresh();
    }

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {unreadCount} unread
                            </Badge>
                        )}
                    </CardTitle>
                    {unreadCount > 0 && (
                        <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
                            <CheckCheck className="mr-2 size-4" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="mb-3 size-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${n.isRead ? "opacity-60" : "bg-muted/50"
                                    }`}
                            >
                                <span className="mt-0.5 text-lg">{typeIcons[n.type] || "📢"}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{n.title}</p>
                                        {!n.isRead && (
                                            <span className="size-2 rounded-full bg-primary flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                                        {n.linkUrl && (
                                            <Link href={n.linkUrl} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                                View <ExternalLink className="size-3" />
                                            </Link>
                                        )}
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n.id)}
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
