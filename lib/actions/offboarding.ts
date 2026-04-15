"use server";

import prisma from "@/lib/prisma";
import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "./tenant-session";
import { requireRole } from "./permissions";
import { EmployeeStatus } from "@/lib/generated/prisma/client";

// Clearance checklist items for offboarding
const CLEARANCE_ITEMS = [
    { key: "company_property", label: "Company property returned (laptop, keys, ID card)" },
    { key: "knowledge_transfer", label: "Knowledge transfer completed" },
    { key: "access_revoked", label: "System access revoked" },
    { key: "final_pay_calculated", label: "Final pay calculated" },
    { key: "exit_interview", label: "Exit interview conducted" },
    { key: "documents_signed", label: "Separation documents signed" },
];

export function getClearanceItems() {
    return CLEARANCE_ITEMS;
}

/**
 * Calculate final pay for a departing employee.
 * Includes prorated salary for the month + unused annual leave payout.
 */
export async function calculateFinalPay(employeeId: string, terminationDate: string) {
    await requireRole("HR_MANAGER");
    const { tenantId } = await requireTenantSession();

    const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
    });
    if (!employee) return { success: false, error: "Employee not found" };

    const termDate = new Date(terminationDate);
    const basicSalary = new Decimal(employee.basicSalary.toString());
    const allowances = new Decimal(employee.allowances.toString());
    const monthlySalary = basicSalary.plus(allowances);

    // Prorated salary: days worked this month / days in month
    const daysInMonth = new Date(
        termDate.getFullYear(),
        termDate.getMonth() + 1,
        0
    ).getDate();
    const daysWorked = termDate.getDate();
    const proratedSalary = monthlySalary
        .times(daysWorked)
        .div(daysInMonth)
        .toDecimalPlaces(2);

    // Unused annual leave payout
    const year = termDate.getFullYear();
    const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
            employeeId_type_year: { employeeId, type: "ANNUAL", year },
        },
    });

    let unusedLeaveDays = 0;
    let leavePayout = new Decimal(0);
    if (leaveBalance) {
        unusedLeaveDays = leaveBalance.entitled + leaveBalance.carried - leaveBalance.used;
        if (unusedLeaveDays > 0) {
            // Daily rate = monthly basic / 22 working days
            const dailyRate = basicSalary.div(22).toDecimalPlaces(2);
            leavePayout = dailyRate.times(unusedLeaveDays).toDecimalPlaces(2);
        }
    }

    const totalFinalPay = proratedSalary.plus(leavePayout).toDecimalPlaces(2);

    return {
        success: true,
        data: {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            basicSalary: basicSalary.toNumber(),
            allowances: allowances.toNumber(),
            monthlySalary: monthlySalary.toNumber(),
            daysInMonth,
            daysWorked,
            proratedSalary: proratedSalary.toNumber(),
            unusedLeaveDays,
            leavePayout: leavePayout.toNumber(),
            totalFinalPay: totalFinalPay.toNumber(),
        },
    };
}

/**
 * Process the offboarding: terminate employee, record details.
 */
export async function processOffboarding(formData: FormData) {
    await requireRole("HR_MANAGER");
    const { tenantId } = await requireTenantSession();

    const employeeId = formData.get("employeeId") as string;
    const terminationDate = formData.get("terminationDate") as string;
    const terminationReason = (formData.get("terminationReason") as string)?.trim();

    if (!employeeId || !terminationDate) {
        return { success: false, error: "Missing required fields" };
    }

    const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
    });
    if (!employee) return { success: false, error: "Employee not found" };

    if (employee.status === "TERMINATED") {
        return { success: false, error: "Employee already terminated" };
    }

    await prisma.employee.update({
        where: { id: employeeId },
        data: {
            status: "TERMINATED" as EmployeeStatus,
            terminationDate: new Date(terminationDate),
            terminationReason: terminationReason || null,
            finalPayProcessed: true,
        },
    });

    // Cancel any pending leave requests
    await prisma.leaveRequest.updateMany({
        where: { employeeId, status: "PENDING" },
        data: { status: "REJECTED" },
    });

    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
}
