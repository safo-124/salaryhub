/**
 * Ghana Payroll Engine
 *
 * Implements statutory deductions for Ghana:
 * - SSNIT Tier 1 (Employee: 5.5%, Employer: 13%)
 * - Tier 2 Pension (5% of basic)
 * - PAYE Income Tax (progressive brackets)
 *
 * All math uses decimal.js — never floating-point.
 */

import Decimal from "decimal.js";

// Configure decimal.js for money precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ─── Ghana PAYE Annual Tax Brackets (2024/2025) ──────────

interface TaxBracket {
    from: Decimal;
    to: Decimal;
    rate: Decimal;
}

const ANNUAL_BRACKETS: TaxBracket[] = [
    { from: new Decimal(0), to: new Decimal(4824), rate: new Decimal(0) },
    { from: new Decimal(4824), to: new Decimal(6024), rate: new Decimal(0.05) },
    { from: new Decimal(6024), to: new Decimal(7224), rate: new Decimal(0.1) },
    { from: new Decimal(7224), to: new Decimal(48024), rate: new Decimal(0.175) },
    {
        from: new Decimal(48024),
        to: new Decimal(240000),
        rate: new Decimal(0.25),
    },
    {
        from: new Decimal(240000),
        to: new Decimal(Infinity),
        rate: new Decimal(0.3),
    },
];

// ─── Rates ───────────────────────────────────────────────

const SSNIT_EMPLOYEE_RATE = new Decimal(0.055); // 5.5%
const SSNIT_EMPLOYER_RATE = new Decimal(0.13); // 13%
const TIER2_RATE = new Decimal(0.05); // 5%

// ─── Calculations ────────────────────────────────────────

/** Calculate annual PAYE from annual taxable income */
export function calculateAnnualPAYE(annualTaxable: Decimal): Decimal {
    let tax = new Decimal(0);
    let remaining = annualTaxable;

    for (const bracket of ANNUAL_BRACKETS) {
        if (remaining.lte(0)) break;

        const width = bracket.to.isFinite()
            ? bracket.to.minus(bracket.from)
            : remaining;

        const taxableInBracket = Decimal.min(remaining, width);
        tax = tax.plus(taxableInBracket.times(bracket.rate));
        remaining = remaining.minus(taxableInBracket);
    }

    return tax;
}

/** Calculate monthly PAYE from monthly taxable income */
export function calculateMonthlyPAYE(monthlyTaxable: Decimal): Decimal {
    const annual = monthlyTaxable.times(12);
    const annualTax = calculateAnnualPAYE(annual);
    return annualTax.dividedBy(12).toDecimalPlaces(2);
}

/** SSNIT employee contribution (5.5% of basic salary) */
export function calculateSSNITEmployee(basicSalary: Decimal): Decimal {
    return basicSalary.times(SSNIT_EMPLOYEE_RATE).toDecimalPlaces(2);
}

/** SSNIT employer contribution (13% of basic salary) */
export function calculateSSNITEmployer(basicSalary: Decimal): Decimal {
    return basicSalary.times(SSNIT_EMPLOYER_RATE).toDecimalPlaces(2);
}

/** Tier 2 pension (5% of basic salary) */
export function calculateTier2(basicSalary: Decimal): Decimal {
    return basicSalary.times(TIER2_RATE).toDecimalPlaces(2);
}

// ─── Full Payslip Calculation ────────────────────────────

export interface PayslipInput {
    basicSalary: Decimal;
    allowances: Decimal;
    overtime: Decimal;
    otherDeductions: Decimal;
}

export interface PayslipResult {
    basicSalary: Decimal;
    allowances: Decimal;
    overtime: Decimal;
    grossPay: Decimal;
    ssnitEmployee: Decimal;
    ssnitEmployer: Decimal;
    tier2: Decimal;
    taxableIncome: Decimal;
    paye: Decimal;
    otherDeductions: Decimal;
    totalDeductions: Decimal;
    netPay: Decimal;
}

/**
 * Calculate a complete Ghana payslip.
 *
 * Formula:
 *   Gross = Basic + Allowances + Overtime
 *   SSNIT Employee = Basic × 5.5%
 *   Tier 2 = Basic × 5%
 *   Taxable = Gross − SSNIT Employee − Tier 2
 *   PAYE = progressive brackets on (Taxable × 12) ÷ 12
 *   Net = Gross − SSNIT Employee − Tier 2 − PAYE − Other Deductions
 */
export function calculatePayslip(input: PayslipInput): PayslipResult {
    const { basicSalary, allowances, overtime, otherDeductions } = input;

    const grossPay = basicSalary.plus(allowances).plus(overtime);
    const ssnitEmployee = calculateSSNITEmployee(basicSalary);
    const ssnitEmployer = calculateSSNITEmployer(basicSalary);
    const tier2 = calculateTier2(basicSalary);

    // Taxable income = Gross - SSNIT Employee - Tier 2
    const taxableIncome = Decimal.max(
        grossPay.minus(ssnitEmployee).minus(tier2),
        new Decimal(0)
    );

    const paye = calculateMonthlyPAYE(taxableIncome);

    const totalDeductions = ssnitEmployee
        .plus(tier2)
        .plus(paye)
        .plus(otherDeductions);

    const netPay = grossPay.minus(totalDeductions).toDecimalPlaces(2);

    return {
        basicSalary,
        allowances,
        overtime,
        grossPay,
        ssnitEmployee,
        ssnitEmployer,
        tier2,
        taxableIncome,
        paye,
        otherDeductions,
        totalDeductions,
        netPay,
    };
}

// ─── Formatting Helpers ──────────────────────────────────

const GHS = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
});

/** Format a Decimal as GHS currency */
export function formatGHS(value: Decimal): string {
    return GHS.format(value.toNumber());
}

/** Format a plain number as GHS currency */
export function formatGHSNumber(value: number): string {
    return GHS.format(value);
}
