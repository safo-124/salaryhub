import { getDepartments } from "@/lib/actions/departments";
import { getEmployees } from "@/lib/actions/employees";
import { DepartmentList } from "./department-list";

export default async function DepartmentsPage() {
    const [departments, employees] = await Promise.all([
        getDepartments(),
        getEmployees(),
    ]);

    const activeEmployees = employees
        .filter((e) => e.status === "ACTIVE")
        .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
                <p className="text-muted-foreground">
                    Manage your organisation&apos;s departments and assign employees.
                </p>
            </div>
            <DepartmentList departments={departments} employees={activeEmployees} />
        </div>
    );
}
