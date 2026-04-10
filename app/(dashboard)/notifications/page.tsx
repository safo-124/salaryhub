import { getNotifications } from "@/lib/actions/notifications";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">
                    Stay updated with your organisation&apos;s activity.
                </p>
            </div>
            <NotificationList notifications={notifications} />
        </div>
    );
}
