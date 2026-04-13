import { requireTenantSession } from "@/lib/actions/tenant-session";
import { getOwnLeaveBalances } from "@/lib/actions/self-service";
import prisma from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export default async function MyProfilePage() {
    const session = await requireTenantSession();
    const employee = session.employeeId
        ? await prisma.employee.findFirst({
            where: { id: session.employeeId, tenantId: session.tenantId },
            include: { departmentRel: { select: { name: true } } },
        })
        : null;

    if (!employee) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">No employee profile linked to your account.</p>
            </div>
        );
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const payslips = await prisma.payslip.findMany({
        where: { employeeId: employee.id },
        include: { payrollRun: { select: { period: true, status: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const leaveBalances = await getOwnLeaveBalances();

    return (
        <ProfileClient
            employee={{
                id: employee.id,
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone,
                department: employee.departmentRel?.name ?? employee.department ?? null,
                jobTitle: employee.jobTitle,
                startDate: employee.startDate.toISOString().split("T")[0],
                basicSalary: Number(employee.basicSalary),
                allowances: Number(employee.allowances),
                bankName: employee.bankName,
                bankAccount: employee.bankAccount,
            }}
            leaveRequests={leaveRequests.map((lr) => ({
                id: lr.id,
                type: lr.type,
                startDate: lr.startDate.toISOString().split("T")[0],
                endDate: lr.endDate.toISOString().split("T")[0],
                days: lr.days,
                status: lr.status,
            }))}
            payslips={payslips.map((ps) => ({
                id: ps.id,
                period: ps.payrollRun.period,
                netPay: Number(ps.netPay),
                status: ps.payrollRun.status,
            }))}
            leaveBalances={leaveBalances}
        />
    );
}
