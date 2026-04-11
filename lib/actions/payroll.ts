"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { calculatePayslip, type PayslipResult } from "@/lib/payroll/ghana";
import { requireTenantSession } from "./tenant-session";
import { PayrollStatus } from "@/lib/generated/prisma/client";

// ─── Helpers ─────────────────────────────────────────────

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    return Number(v);
}

// ─── Queries ─────────────────────────────────────────────

export async function getPayrollRuns() {
    const { tenantId } = await requireTenantSession();
    const runs = await prisma.payrollRun.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { payslips: true } } },
    });
    return runs.map((r) => ({
        id: r.id,
        period: r.period,
        status: r.status,
        totalGross: toNum(r.totalGross),
        totalNet: toNum(r.totalNet),
        totalTax: toNum(r.totalTax),
        employeeCount: r.employeeCount,
        processedBy: r.processedBy,
        processedAt: r.processedAt?.toISOString() ?? null,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt?.toISOString() ?? null,
    }));
}

export async function getPayrollRun(id: string) {
    const { tenantId } = await requireTenantSession();
    const run = await prisma.payrollRun.findFirst({
        where: { id, tenantId },
        include: {
            payslips: {
                include: {
                    employee: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                },
            },
        },
    });
    if (!run) return null;
    return {
        id: run.id,
        period: run.period,
        status: run.status,
        totalGross: toNum(run.totalGross),
        totalNet: toNum(run.totalNet),
        totalTax: toNum(run.totalTax),
        employeeCount: run.employeeCount,
        processedBy: run.processedBy,
        processedAt: run.processedAt?.toISOString() ?? null,
        approvedBy: run.approvedBy,
        approvedAt: run.approvedAt?.toISOString() ?? null,
        payslips: run.payslips.map((s) => ({
            id: s.id,
            payrollRunId: s.payrollRunId,
            employeeId: s.employeeId,
            employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
            employeeCode: s.employee.employeeId,
            period: s.period,
            basicSalary: toNum(s.basicSalary),
            allowances: toNum(s.allowances),
            overtime: toNum(s.overtime),
            grossPay: toNum(s.grossPay),
            ssnitEmployee: toNum(s.ssnitEmployee),
            ssnitEmployer: toNum(s.ssnitEmployer),
            tier2: toNum(s.tier2),
            paye: toNum(s.paye),
            otherDeductions: toNum(s.otherDeductions),
            netPay: toNum(s.netPay),
        })),
    };
}

export async function getPayslip(id: string) {
    const { tenantId } = await requireTenantSession();
    const slip = await prisma.payslip.findFirst({
        where: {
            id,
            payrollRun: { tenantId },
        },
        include: {
            employee: {
                select: { firstName: true, lastName: true, employeeId: true },
            },
            payrollRun: { select: { status: true } },
        },
    });
    if (!slip) return null;
    return {
        id: slip.id,
        payrollRunId: slip.payrollRunId,
        employeeId: slip.employeeId,
        employeeName: `${slip.employee.firstName} ${slip.employee.lastName}`,
        employeeCode: slip.employee.employeeId,
        period: slip.period,
        basicSalary: toNum(slip.basicSalary),
        allowances: toNum(slip.allowances),
        overtime: toNum(slip.overtime),
        grossPay: toNum(slip.grossPay),
        ssnitEmployee: toNum(slip.ssnitEmployee),
        ssnitEmployer: toNum(slip.ssnitEmployer),
        tier2: toNum(slip.tier2),
        paye: toNum(slip.paye),
        otherDeductions: toNum(slip.otherDeductions),
        netPay: toNum(slip.netPay),
        runStatus: slip.payrollRun.status,
    };
}

export async function getPayslips() {
    const { tenantId } = await requireTenantSession();
    const slips = await prisma.payslip.findMany({
        where: { payrollRun: { tenantId } },
        include: {
            employee: {
                select: { firstName: true, lastName: true, employeeId: true },
            },
            payrollRun: { select: { status: true, period: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return slips.map((s) => ({
        id: s.id,
        payrollRunId: s.payrollRunId,
        employeeName: `${s.employee.firstName} ${s.employee.lastName}`,
        employeeCode: s.employee.employeeId,
        period: s.payrollRun.period,
        grossPay: toNum(s.grossPay),
        netPay: toNum(s.netPay),
        paye: toNum(s.paye),
        runStatus: s.payrollRun.status,
    }));
}

// ─── Mutations ───────────────────────────────────────────

export async function runPayroll(formData: FormData) {
    const { tenantId, userName } = await requireTenantSession();
    const period = formData.get("period") as string;
    if (!period) return { success: false, error: "Period is required" };

    // Check if period already exists for this tenant
    const existing = await prisma.payrollRun.findFirst({
        where: { tenantId, period },
    });
    if (existing) {
        return { success: false, error: `Payroll for ${period} already exists` };
    }

    // Get all active employees for this tenant (include salary structure)
    const employees = await prisma.employee.findMany({
        where: { tenantId, status: "ACTIVE" },
        include: { salaryStructure: true },
    });

    if (employees.length === 0) {
        return { success: false, error: "No active employees to process" };
    }

    // Calculate payslips
    let totalGross = new Decimal(0);
    let totalNet = new Decimal(0);
    let totalTax = new Decimal(0);

    const payslipData: {
        employeeId: string;
        period: string;
        basicSalary: Decimal;
        allowances: Decimal;
        overtime: Decimal;
        grossPay: Decimal;
        ssnitEmployee: Decimal;
        ssnitEmployer: Decimal;
        tier2: Decimal;
        paye: Decimal;
        otherDeductions: Decimal;
        netPay: Decimal;
    }[] = [];

    for (const emp of employees) {
        // Sum approved overtime for this period
        const overtimeEntries = await prisma.overtimeEntry.findMany({
            where: {
                employeeId: emp.id,
                status: "APPROVED",
                date: {
                    gte: new Date(`${period}-01`),
                    lt: new Date(
                        new Date(`${period}-01`).setMonth(
                            new Date(`${period}-01`).getMonth() + 1
                        )
                    ),
                },
            },
        });
        const overtimeAmount = overtimeEntries.reduce(
            (sum, ot) => sum.plus(new Decimal(String(ot.amount))),
            new Decimal(0)
        );

        // Apply salary structure components if assigned
        let structureAllowances = new Decimal(0);
        let structureDeductions = new Decimal(0);
        const basicSalary = new Decimal(String(emp.basicSalary));

        if (emp.salaryStructure) {
            const components = emp.salaryStructure.components as { name: string; type: "earning" | "deduction"; calcType: "fixed" | "percentage"; value: number }[];
            for (const comp of components) {
                const amount = comp.calcType === "percentage"
                    ? basicSalary.times(comp.value).div(100)
                    : new Decimal(comp.value);
                if (comp.type === "earning") {
                    structureAllowances = structureAllowances.plus(amount);
                } else {
                    structureDeductions = structureDeductions.plus(amount);
                }
            }
        }

        const result: PayslipResult = calculatePayslip({
            basicSalary,
            allowances: new Decimal(String(emp.allowances)).plus(structureAllowances),
            overtime: overtimeAmount,
            otherDeductions: structureDeductions,
        });

        payslipData.push({
            employeeId: emp.id,
            period,
            basicSalary: result.basicSalary,
            allowances: result.allowances,
            overtime: result.overtime,
            grossPay: result.grossPay,
            ssnitEmployee: result.ssnitEmployee,
            ssnitEmployer: result.ssnitEmployer,
            tier2: result.tier2,
            paye: result.paye,
            otherDeductions: result.otherDeductions,
            netPay: result.netPay,
        });

        totalGross = totalGross.plus(result.grossPay);
        totalNet = totalNet.plus(result.netPay);
        totalTax = totalTax.plus(result.paye);
    }

    // Create payroll run + payslips in a transaction
    const run = await prisma.payrollRun.create({
        data: {
            tenantId,
            period,
            status: "PENDING_APPROVAL",
            totalGross: totalGross.toDecimalPlaces(2).toNumber(),
            totalNet: totalNet.toDecimalPlaces(2).toNumber(),
            totalTax: totalTax.toDecimalPlaces(2).toNumber(),
            employeeCount: employees.length,
            processedBy: userName,
            processedAt: new Date(),
            payslips: {
                create: payslipData.map((p) => ({
                    employeeId: p.employeeId,
                    period: p.period,
                    basicSalary: p.basicSalary.toNumber(),
                    allowances: p.allowances.toNumber(),
                    overtime: p.overtime.toNumber(),
                    grossPay: p.grossPay.toNumber(),
                    ssnitEmployee: p.ssnitEmployee.toNumber(),
                    ssnitEmployer: p.ssnitEmployer.toNumber(),
                    tier2: p.tier2.toNumber(),
                    paye: p.paye.toNumber(),
                    otherDeductions: p.otherDeductions.toNumber(),
                    netPay: p.netPay.toNumber(),
                })),
            },
        },
    });

    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true, id: run.id };
}

export async function approvePayroll(id: string) {
    const { tenantId, userName } = await requireTenantSession();
    const run = await prisma.payrollRun.findFirst({
        where: { id, tenantId },
    });
    if (!run) return { success: false, error: "Payroll run not found" };
    if (run.status !== "PENDING_APPROVAL") {
        return { success: false, error: "Can only approve pending payroll" };
    }

    await prisma.payrollRun.update({
        where: { id },
        data: {
            status: "APPROVED" as PayrollStatus,
            approvedBy: userName,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${id}`);
    revalidatePath("/");
    return { success: true };
}

export async function markPayrollPaid(id: string) {
    const { tenantId } = await requireTenantSession();
    const run = await prisma.payrollRun.findFirst({
        where: { id, tenantId },
    });
    if (!run) return { success: false, error: "Payroll run not found" };
    if (run.status !== "APPROVED") {
        return { success: false, error: "Can only mark approved payroll as paid" };
    }

    await prisma.payrollRun.update({
        where: { id },
        data: { status: "PAID" as PayrollStatus },
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${id}`);
    revalidatePath("/");
    return { success: true };
}
