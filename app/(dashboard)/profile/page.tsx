import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { requireTenantSession } from "@/lib/actions/tenant-session";
import prisma from "@/lib/prisma";

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export default async function MyProfilePage() {
    const session = await requireTenantSession();
    const employee = session.employeeId
        ? await prisma.employee.findFirst({
            where: { id: session.employeeId, tenantId: session.tenantId },
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

    const statusColors: Record<string, string> = {
        PENDING: "bg-warning/10 text-warning",
        APPROVED: "bg-success/10 text-success",
        REJECTED: "bg-destructive/10 text-destructive",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">
                    {employee.firstName} {employee.lastName} · {employee.employeeId}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Name" value={`${employee.firstName} ${employee.lastName}`} />
                        <DetailRow label="Email" value={employee.email} />
                        <DetailRow label="Phone" value={employee.phone || "—"} />
                        <DetailRow label="Department" value={employee.department || "—"} />
                        <DetailRow label="Job Title" value={employee.jobTitle || "—"} />
                        <DetailRow label="Start Date" value={employee.startDate.toISOString().split("T")[0]} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Compensation</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Basic Salary" value={fmtGHS(Number(employee.basicSalary))} />
                        <DetailRow label="Allowances" value={fmtGHS(Number(employee.allowances))} />
                        <Separator />
                        <DetailRow label="Bank" value={employee.bankName || "—"} />
                        <DetailRow label="Account" value={employee.bankAccount ? `•••${employee.bankAccount.slice(-4)}` : "—"} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Leave Requests</CardTitle>
                        <CardDescription>Your last 5 leave requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leaveRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {leaveRequests.map((lr) => (
                                    <div key={lr.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{lr.type} Leave</p>
                                            <p className="text-xs text-muted-foreground">
                                                {lr.startDate.toISOString().split("T")[0]} – {lr.endDate.toISOString().split("T")[0]} ({lr.days} days)
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className={statusColors[lr.status] || ""}>
                                            {lr.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payslips</CardTitle>
                        <CardDescription>Your last 5 payslips</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payslips.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payslips yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {payslips.map((ps) => (
                                    <div key={ps.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{ps.payrollRun.period}</p>
                                            <p className="text-xs text-muted-foreground">Net: {fmtGHS(Number(ps.netPay))}</p>
                                        </div>
                                        <Badge variant="secondary" className={ps.payrollRun.status === "PAID" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                                            {ps.payrollRun.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
