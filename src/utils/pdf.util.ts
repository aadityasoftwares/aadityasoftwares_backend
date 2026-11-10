import PDFDocument from "pdfkit";

export interface IPdfInvoiceData {
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate: Date | string;
    company: {
        name: string;
        address: string;
        email: string;
        phone: string;
        gstin: string;
        pan?: string;
        bankName?: string;
        bankAccount?: string;
        bankIfsc?: string;
        upiId?: string;
    };
    client: {
        name: string;
        companyName?: string;
        email?: string;
        phone?: string;
        gstin?: string;
        address?: string;
    };
    items: Array<{
        description: string;
        hsnSacCode?: string;
        quantity: number;
        unitRate: number;
        taxableAmount: number;
        gstRate: number;
        totalAmount: number;
    }>;
    subTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
    currencySymbol?: string;
    notes?: string;
    terms?: string;
}

export class PdfUtil {
    static async generateInvoicePdf(data: IPdfInvoiceData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: "A4" });
                const buffers: Buffer[] = [];

                doc.on("data", (chunk: Buffer) => buffers.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(buffers)));
                doc.on("error", (err: Error) => reject(err));

                const symbol = data.currencySymbol || "INR ";

                // Header
                doc.fontSize(20).font("Helvetica-Bold").text(data.company.name, 40, 40);
                doc.fontSize(9).font("Helvetica").text(data.company.address);
                doc.text(`Email: ${data.company.email} | Phone: ${data.company.phone}`);
                doc.text(`GSTIN: ${data.company.gstin}${data.company.pan ? ` | PAN: ${data.company.pan}` : ""}`);

                doc.fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", 400, 40, { align: "right" });
                doc.fontSize(9).font("Helvetica").text(`Invoice No: ${data.invoiceNumber}`, 400, 65, { align: "right" });
                doc.text(`Date: ${new Date(data.issueDate).toLocaleDateString("en-IN")}`, 400, 80, { align: "right" });
                doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString("en-IN")}`, 400, 95, { align: "right" });

                doc.moveDown(2);
                const currentY = 125;
                doc.rect(40, currentY, 515, 1).fill("#cccccc");

                // Billed To
                doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text("Billed To:", 40, currentY + 10);
                doc.fontSize(9).font("Helvetica");
                if (data.client.companyName) doc.text(data.client.companyName, 40, currentY + 25);
                doc.text(data.client.name, 40, currentY + 38);
                if (data.client.address) doc.text(data.client.address, 40, currentY + 51);
                if (data.client.gstin) doc.text(`GSTIN: ${data.client.gstin}`, 40, currentY + 64);

                // Table Header
                const tableTop = currentY + 90;
                doc.rect(40, tableTop, 515, 20).fill("#f0f0f0");
                doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
                doc.text("Item / Description", 45, tableTop + 5);
                doc.text("HSN/SAC", 260, tableTop + 5);
                doc.text("Qty", 325, tableTop + 5, { width: 30, align: "right" });
                doc.text("Rate", 365, tableTop + 5, { width: 55, align: "right" });
                doc.text("Tax", 430, tableTop + 5, { width: 40, align: "right" });
                doc.text("Amount", 480, tableTop + 5, { width: 70, align: "right" });

                // Table Rows
                let y = tableTop + 25;
                doc.font("Helvetica").fontSize(9);
                for (const item of data.items) {
                    doc.text(item.description, 45, y, { width: 210 });
                    doc.text(item.hsnSacCode || "-", 260, y);
                    doc.text(String(item.quantity), 325, y, { width: 30, align: "right" });
                    doc.text(`${symbol}${item.unitRate.toFixed(2)}`, 365, y, { width: 55, align: "right" });
                    doc.text(`${item.gstRate}%`, 430, y, { width: 40, align: "right" });
                    doc.text(`${symbol}${item.totalAmount.toFixed(2)}`, 480, y, { width: 70, align: "right" });
                    y += 20;
                }

                doc.rect(40, y, 515, 1).fill("#cccccc");
                y += 10;

                // Summary Totals
                const summaryX = 350;
                doc.fillColor("#000000");
                doc.text("Taxable Value:", summaryX, y);
                doc.text(`${symbol}${data.taxableAmount.toFixed(2)}`, 450, y, { width: 100, align: "right" });
                y += 15;

                if (data.cgstTotal > 0) {
                    doc.text("CGST:", summaryX, y);
                    doc.text(`${symbol}${data.cgstTotal.toFixed(2)}`, 450, y, { width: 100, align: "right" });
                    y += 15;
                }
                if (data.sgstTotal > 0) {
                    doc.text("SGST:", summaryX, y);
                    doc.text(`${symbol}${data.sgstTotal.toFixed(2)}`, 450, y, { width: 100, align: "right" });
                    y += 15;
                }
                if (data.igstTotal > 0) {
                    doc.text("IGST:", summaryX, y);
                    doc.text(`${symbol}${data.igstTotal.toFixed(2)}`, 450, y, { width: 100, align: "right" });
                    y += 15;
                }

                doc.fontSize(11).font("Helvetica-Bold");
                doc.text("Total Amount:", summaryX, y);
                doc.text(`${symbol}${data.grandTotal.toFixed(2)}`, 450, y, { width: 100, align: "right" });
                y += 25;

                // Bank Details
                if (data.company.bankAccount) {
                    doc.fontSize(10).font("Helvetica-Bold").text("Bank Details for Payment:", 40, y);
                    doc.fontSize(8).font("Helvetica");
                    doc.text(`Bank: ${data.company.bankName || "HDFC Bank"} | A/c No: ${data.company.bankAccount}`);
                    doc.text(`IFSC: ${data.company.bankIfsc || ""} | UPI ID: ${data.company.upiId || ""}`);
                    y += 35;
                }

                // Terms
                if (data.terms) {
                    doc.fontSize(8).font("Helvetica-Bold").text("Terms & Conditions:", 40, y);
                    doc.font("Helvetica").text(data.terms, 40, y + 12, { width: 515 });
                }

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static async generateQuotationPdf(data: IPdfInvoiceData): Promise<Buffer> {
        // Reuses same layout with "PROPOSAL / QUOTATION" title
        return this.generateInvoicePdf({
            ...data,
            invoiceNumber: data.invoiceNumber.replace("INV-", "QT-"),
        });
    }
}

