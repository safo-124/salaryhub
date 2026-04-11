import { getEmployee } from "@/lib/actions/employees";
import { getSalaryStructures } from "@/lib/actions/salary-structures";
import { getDepartments } from "@/lib/actions/departments";
import { EditEmployeeForm } from "./edit-employee-form";

export default async function EditEmployeePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = (await params);
    const [employee, salaryStructures, departments] = await Promise.all([
        getEmployee(id),
        getSalaryStructures(),
        getDepartments(),
    ]);

    if (!employee) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Employee not found.</p>
            </div>
        );
    }

    return (
        <EditEmployeeForm
            employee={employee}
            salaryStructures={salaryStructures}
            departments={departments}
        />
    );
}
