import { getSalaryStructures } from "@/lib/actions/salary-structures";
import { getDepartments } from "@/lib/actions/departments";
import { NewEmployeeForm } from "./new-employee-form";

export default async function NewEmployeePage() {
    const [salaryStructures, departments] = await Promise.all([
        getSalaryStructures(),
        getDepartments(),
    ]);
    return (
        <NewEmployeeForm
            salaryStructures={salaryStructures}
            departments={departments}
        />
    );
}
