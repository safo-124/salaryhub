import { getAvailablePeriods } from "@/lib/actions/statutory-reports";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
    const periods = await getAvailablePeriods();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Statutory Reports</h1>
                <p className="text-muted-foreground">
                    Generate GRA PAYE returns and SSNIT contribution reports for compliance filing.
                </p>
            </div>
            <ReportsClient periods={periods} />
        </div>
    );
}
