import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { requireTenantSession } from "@/lib/actions/tenant-session";

function fmtGHS(n: number) {
    return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Verify auth
    let session;
    try {
        session = await requireTenantSession();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch payslip
    const payslip = await prisma.payslip.findFirst({
        where: { id, payrollRun: { tenantId: session.tenantId } },
        include: {
            employee: { select: { firstName: true, lastName: true, employeeId: true, department: true, jobTitle: true, ssnit: true, tin: true } },
            payrollRun: { select: { period: true, status: true } },
        },
    });

    if (!payslip) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch tenant name
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { name: true },
    });

    // Generate PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // ─── Header ───
    doc.fontSize(20).font("Helvetica-Bold").text(tenant?.name || "SalaryHub", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text("Payslip", 50, 75);
    doc.moveTo(50, 95).lineTo(545, 95).stroke("#dddddd");

    // ─── Employee Info ───
    const y1 = 110;
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
    doc.text("Employee", 50, y1);
    doc.font("Helvetica").fillColor("#333333");
    doc.text(`${payslip.employee.firstName} ${payslip.employee.lastName}`, 50, y1 + 15);
    doc.text(`ID: ${payslip.employee.employeeId}`, 50, y1 + 30);
    if (payslip.employee.department) doc.text(`Dept: ${payslip.employee.department}`, 50, y1 + 45);
    if (payslip.employee.jobTitle) doc.text(`Title: ${payslip.employee.jobTitle}`, 50, y1 + 60);

    doc.font("Helvetica-Bold").fillColor("#000000");
    doc.text("Pay Period", 350, y1);
    doc.font("Helvetica").fillColor("#333333");
    doc.text(payslip.payrollRun.period, 350, y1 + 15);
    doc.text(`Status: ${payslip.payrollRun.status}`, 350, y1 + 30);
    if (payslip.employee.ssnit) doc.text(`SSNIT: ${payslip.employee.ssnit}`, 350, y1 + 45);
    if (payslip.employee.tin) doc.text(`TIN: ${payslip.employee.tin}`, 350, y1 + 60);

    // ─── Earnings Table ───
    let y = 200;
    doc.moveTo(50, y).lineTo(545, y).stroke("#dddddd");
    y += 10;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text("EARNINGS", 50, y);
    y += 20;

    function tableRow(label: string, value: string, yPos: number, bold = false) {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor("#333333");
        doc.text(label, 60, yPos);
        doc.text(value, 400, yPos, { width: 135, align: "right" });
        return yPos + 18;
    }

    y = tableRow("Basic Salary", fmtGHS(Number(payslip.basicSalary)), y);
    y = tableRow("Allowances", fmtGHS(Number(payslip.allowances)), y);
    y = tableRow("Overtime", fmtGHS(Number(payslip.overtime)), y);
    doc.moveTo(60, y).lineTo(535, y).stroke("#eeeeee");
    y += 5;
    y = tableRow("Gross Pay", fmtGHS(Number(payslip.grossPay)), y, true);

    // ─── Deductions Table ───
    y += 15;
    doc.moveTo(50, y).lineTo(545, y).stroke("#dddddd");
    y += 10;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text("DEDUCTIONS", 50, y);
    y += 20;

    y = tableRow("SSNIT Employee (5.5%)", `-${fmtGHS(Number(payslip.ssnitEmployee))}`, y);
    y = tableRow("Tier 2 Pension (5%)", `-${fmtGHS(Number(payslip.tier2))}`, y);
    y = tableRow("PAYE Income Tax", `-${fmtGHS(Number(payslip.paye))}`, y);
    if (Number(payslip.otherDeductions) > 0) {
        y = tableRow("Other Deductions", `-${fmtGHS(Number(payslip.otherDeductions))}`, y);
    }

    // ─── Net Pay ───
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).stroke("#000000");
    y += 10;
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#000000");
    doc.text("NET PAY", 60, y);
    doc.text(fmtGHS(Number(payslip.netPay)), 350, y, { width: 185, align: "right" });

    // ─── Employer Contribution ───
    y += 35;
    doc.rect(50, y, 495, 35).fill("#f5f5f5");
    doc.font("Helvetica").fontSize(9).fillColor("#666666");
    doc.text(`Employer SSNIT Contribution (13%): ${fmtGHS(Number(payslip.ssnitEmployer))}`, 60, y + 12);

    // ─── Footer ───
    doc.font("Helvetica").fontSize(8).fillColor("#999999");
    doc.text(
        "This is a computer-generated payslip. No signature required.",
        50,
        750,
        { align: "center", width: 495 }
    );
    doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GH")} by SalaryHub`,
        50,
        762,
        { align: "center", width: 495 }
    );

    doc.end();
    const pdfBuffer = await pdfReady;

    const filename = `payslip-${payslip.employee.employeeId}-${payslip.payrollRun.period}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
