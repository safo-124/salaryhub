# SalaryHub — Tenant Admin Improvement Ideas

## What Famous Payroll Apps Do (That SalaryHub Is Missing)

### 1. Payslip PDF Generation (Gusto, Rippling, PayFit)
- "Download PDF" button exists but is disabled
- Every major payroll app lets employees and admins download branded PDF payslips
- Table stakes feature

### 2. Leave Balance / Entitlements (BambooHR, Zoho Payroll, Deel)
- Currently tracks leave requests but never tracks balances
- No concept of "Employee X has 15 annual leave days, used 8, 7 remaining"
- Need leave balance tracking with accrual policies (monthly, annual, carry-over rules)

### 3. Bulk Employee Import (Rippling, Gusto, PaycheckCity)
- No CSV upload for employees
- Every payroll app supports importing 50-500 employees via spreadsheet on first setup

### 4. Email Notifications (All major platforms)
- Notification table exists in DB but nothing sends emails
- Leave approvals, payroll completion, and new payslip availability should trigger email

### 5. Reports / Analytics Dashboard (ADP, Paychex, Sage)
- Only basic charts exist
- Major platforms offer: headcount trends, turnover rate, department cost breakdown, tax liability reports, year-end summaries, GRA PAYE returns (Ghana-specific), and custom report builders

### 6. Payroll Reversal & Amendments (Sage, Xero Payroll)
- Once a payroll is run, there's no way to reverse or recalculate
- Real apps allow corrections, supplementary runs, and back-pay calculations

### 7. Salary Structure Templates Applied to Payroll (Zoho, greytHR)
- `SalaryStructure` model built with components but never used in the payroll engine
- Top apps let you assign structures to employees so earnings/deductions are automatically calculated

### 8. Multi-Level Approval Workflows (Keka, Darwinbox)
- Current approvals are flat (PENDING → APPROVED)
- Enterprise apps support: Employee → Supervisor → HR → Finance chains

### 9. Employee Self-Service Portal (All competitors)
- `/profile` page is read-only
- Competitors let employees: update personal info, request leave themselves, view payslip history, upload documents, update bank details (with admin approval)

### 10. Document Management (BambooHR, Rippling)
- No document storage
- Employees need to upload/view: contracts, ID documents, tax forms, offer letters

### 11. Statutory Filing / Compliance (PayFit, Sage)
- Ghana-specific: Generate GRA PAYE monthly returns, SSNIT monthly contribution reports, Tier 2 trustee reports
- Required by law; every Ghana payroll tool (BsystemsPayAngel, ExpressPay Payroll) automates them

### 12. Offboarding / Termination Workflow (Gusto, Rippling)
- Status can be set to TERMINATED but there's no final pay calculation, clearance checklist, or exit process

---

## Prioritized Improvement Recommendations

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| **P0** | Leave balances & entitlements | Medium | Critical gap |
| **P0** | Payslip PDF download | Low | Table stakes |
| **P0** | Wire salary structures into payroll engine | Medium | Already built, just unused |
| **P1** | Bulk employee CSV import | Low | First-time setup blocker |
| **P1** | Statutory reports (GRA PAYE, SSNIT returns) | Medium | Legal compliance |
| **P1** | Employee self-service (edit own info, request leave) | Medium | Major UX |
| **P2** | Email notifications (leave/payroll events) | Medium | Expected feature |
| **P2** | Payroll reversal & amendments | Medium | Operational need |
| **P2** | Reports page (headcount, cost, tax summaries) | Medium | Analytics |
| **P3** | Document upload/management | Medium | Nice to have |
| **P3** | Multi-level approval chains | High | Enterprise feature |
| **P3** | Offboarding workflow with final pay | Low | Completeness |
