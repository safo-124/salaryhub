import { getPayrollPeriodsForComparison } from "@/lib/actions/compare";
import { CompareClient } from "./compare-client";

export default async function PayrollComparePage() {
    const periods = await getPayrollPeriodsForComparison();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payroll Comparison</h1>
                <p className="text-muted-foreground">
                    Compare two payroll periods side by side.
                </p>
            </div>
            <CompareClient periods={periods} />
        </div>
    );
}
