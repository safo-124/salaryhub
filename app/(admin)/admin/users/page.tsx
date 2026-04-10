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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdmins } from "@/lib/actions/admin";

export default async function PlatformUsersPage() {
    const admins = await getAdmins();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Platform Users</h1>
                    <p className="text-muted-foreground">
                        Manage super admin and support accounts.
                    </p>
                </div>
                <Button render={<Link href="/admin/users/new" />}>
                    <Plus className="mr-2 size-4" />
                    Add Admin
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Accounts</CardTitle>
                    <CardDescription>
                        {admins.length} user{admins.length !== 1 ? "s" : ""} with platform-level access to SalaryHub.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                user.role === "SUPER_ADMIN"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            }
                                        >
                                            {user.role.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleString("en-GH", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "Never"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString("en-GH", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
