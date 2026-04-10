import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getOvertimeEntries } from "@/lib/actions/overtime";
import { getEmployees } from "@/lib/actions/employees";
import { NewOvertimeForm } from "./new-overtime-form";
import { OvertimeTable } from "./overtime-table";

const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-destructive/10 text-destructive",
};

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export default async function OvertimePage() {
    const [entries, employees] = await Promise.all([
        getOvertimeEntries(),
        getEmployees(),
    ]);
    const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Overtime Tracking
                    </h1>
                    <p className="text-muted-foreground">
                        Log and approve employee overtime hours.
                    </p>
                </div>
                <NewOvertimeForm employees={activeEmployees} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Overtime Entries</CardTitle>
                    <CardDescription>
                        {entries.length === 0
                            ? "No overtime entries yet."
                            : `${entries.length} entr${entries.length !== 1 ? "ies" : "y"} total.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            No overtime entries logged yet.
                        </p>
                    ) : (
                        <OvertimeTable entries={entries} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
