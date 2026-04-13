"use server";

import prisma from "@/lib/prisma";
import { requireTenantSession } from "./tenant-session";

/**
 * GRA PAYE Monthly Return — lists each employee's taxable income, PAYE deducted
 * SSNIT Monthly Contribution Report — employee & employer SSNIT + Tier 2
 */

export async function generateGRAPAYEReturn(period: string) {
    const { tenantId } = await requireTenantSession();

    const run = await prisma.payrollRun.findFirst({
        where: { tenantId, period },
        include: {
            payslips: {
                include: {
                    employee: {
                        select: {
                            employeeId: true,
                            firstName: true,
                            lastName: true,
                            tin: true,
                            ssnit: true,
                        },
                    },
                },
            },
        },
    });

    if (!run) return { success: false as const, error: `No payroll found for ${period}` };

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
    });

    const rows = run.payslips.map((s) => ({
        employeeId: s.employee.employeeId,
        name: `${s.employee.firstName} ${s.employee.lastName}`,
        tin: s.employee.tin || "N/A",
        ssnit: s.employee.ssnit || "N/A",
        basicSalary: Number(s.basicSalary),
        allowances: Number(s.allowances),
        grossPay: Number(s.grossPay),
        ssnitEmployee: Number(s.ssnitEmployee),
        tier2: Number(s.tier2),
        taxableIncome: Number(s.grossPay) - Number(s.ssnitEmployee) - Number(s.tier2),
        paye: Number(s.paye),
    }));

    const totals = rows.reduce(
        (acc, r) => ({
            basicSalary: acc.basicSalary + r.basicSalary,
            allowances: acc.allowances + r.allowances,
            grossPay: acc.grossPay + r.grossPay,
            ssnitEmployee: acc.ssnitEmployee + r.ssnitEmployee,
            tier2: acc.tier2 + r.tier2,
            taxableIncome: acc.taxableIncome + r.taxableIncome,
            paye: acc.paye + r.paye,
        }),
        { basicSalary: 0, allowances: 0, grossPay: 0, ssnitEmployee: 0, tier2: 0, taxableIncome: 0, paye: 0 }
    );

    return {
        success: true as const,
        data: {
            tenantName: tenant?.name || "Unknown",
            period,
            generatedAt: new Date().toISOString(),
            rows,
            totals,
        },
    };
}

export async function generateSSNITReturn(period: string) {
    const { tenantId } = await requireTenantSession();

    const run = await prisma.payrollRun.findFirst({
        where: { tenantId, period },
        include: {
            payslips: {
                include: {
                    employee: {
                        select: {
                            employeeId: true,
                            firstName: true,
                            lastName: true,
                            ssnit: true,
                        },
                    },
                },
            },
        },
    });

    if (!run) return { success: false as const, error: `No payroll found for ${period}` };

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
    });

    const rows = run.payslips.map((s) => ({
        employeeId: s.employee.employeeId,
        name: `${s.employee.firstName} ${s.employee.lastName}`,
        ssnit: s.employee.ssnit || "N/A",
        basicSalary: Number(s.basicSalary),
        ssnitEmployee: Number(s.ssnitEmployee),
        ssnitEmployer: Number(s.ssnitEmployer),
        tier1Total: Number(s.ssnitEmployee) + Number(s.ssnitEmployer),
        tier2: Number(s.tier2),
    }));

    const totals = rows.reduce(
        (acc, r) => ({
            basicSalary: acc.basicSalary + r.basicSalary,
            ssnitEmployee: acc.ssnitEmployee + r.ssnitEmployee,
            ssnitEmployer: acc.ssnitEmployer + r.ssnitEmployer,
            tier1Total: acc.tier1Total + r.tier1Total,
            tier2: acc.tier2 + r.tier2,
        }),
        { basicSalary: 0, ssnitEmployee: 0, ssnitEmployer: 0, tier1Total: 0, tier2: 0 }
    );

    return {
        success: true as const,
        data: {
            tenantName: tenant?.name || "Unknown",
            period,
            generatedAt: new Date().toISOString(),
            rows,
            totals,
        },
    };
}

export async function exportGRAPAYECSV(period: string) {
    const result = await generateGRAPAYEReturn(period);
    if (!result.success) return result.error;

    const { data } = result;
    const headers = "Employee ID,Name,TIN,Basic Salary,Allowances,Gross Pay,SSNIT (5.5%),Tier 2 (5%),Taxable Income,PAYE";
    const rows = data.rows.map((r) =>
        [r.employeeId, `"${r.name}"`, r.tin, r.basicSalary.toFixed(2), r.allowances.toFixed(2), r.grossPay.toFixed(2), r.ssnitEmployee.toFixed(2), r.tier2.toFixed(2), r.taxableIncome.toFixed(2), r.paye.toFixed(2)].join(",")
    );
    const totalsRow = `,,TOTALS,${data.totals.basicSalary.toFixed(2)},${data.totals.allowances.toFixed(2)},${data.totals.grossPay.toFixed(2)},${data.totals.ssnitEmployee.toFixed(2)},${data.totals.tier2.toFixed(2)},${data.totals.taxableIncome.toFixed(2)},${data.totals.paye.toFixed(2)}`;

    return [headers, ...rows, totalsRow].join("\n");
}

export async function exportSSNITCSV(period: string) {
    const result = await generateSSNITReturn(period);
    if (!result.success) return result.error;

    const { data } = result;
    const headers = "Employee ID,Name,SSNIT No,Basic Salary,Employee (5.5%),Employer (13%),Tier 1 Total,Tier 2 (5%)";
    const rows = data.rows.map((r) =>
        [r.employeeId, `"${r.name}"`, r.ssnit, r.basicSalary.toFixed(2), r.ssnitEmployee.toFixed(2), r.ssnitEmployer.toFixed(2), r.tier1Total.toFixed(2), r.tier2.toFixed(2)].join(",")
    );
    const totalsRow = `,,TOTALS,${data.totals.basicSalary.toFixed(2)},${data.totals.ssnitEmployee.toFixed(2)},${data.totals.ssnitEmployer.toFixed(2)},${data.totals.tier1Total.toFixed(2)},${data.totals.tier2.toFixed(2)}`;

    return [headers, ...rows, totalsRow].join("\n");
}

export async function getAvailablePeriods() {
    const { tenantId } = await requireTenantSession();
    const runs = await prisma.payrollRun.findMany({
        where: { tenantId },
        select: { period: true, status: true },
        orderBy: { period: "desc" },
    });
    return runs.map((r) => ({ period: r.period, status: r.status }));
}
