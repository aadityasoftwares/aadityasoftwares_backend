import { InvoiceRepository } from "../repositories/invoice.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { SequenceCounterService } from "../../../services/sequenceCounter.service.js";
import { InvoiceStatus } from "../constants/invoice.enums.js";
import type { IInvoice, IInvoiceFilter } from "../interfaces/invoice.interface.js";
import { ClientService } from "../../clients/services/client.service.js";
import { QuotationModel } from "../../quotations/models/quotation.model.js";
import { QuotationStatus } from "../../quotations/constants/quotation.enums.js";
import { GstUtil, type IGstItemInput } from "../../../utils/gst.util.js";
import { PdfUtil } from "../../../utils/pdf.util.js";
import { SystemSettingModel } from "../../systemsettings/models/systemSetting.model.js";
import { SystemSettingKey } from "../../systemsettings/constants/systemSetting.enums.js";
import { sendEmail } from "../../../emails/services/emailService.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { Types } from "mongoose";

export class InvoiceService {
    private invoiceRepository: InvoiceRepository;
    private clientService: ClientService;
    private auditLogService: AuditLogService;

    constructor() {
        this.invoiceRepository = new InvoiceRepository();
        this.clientService = new ClientService();
        this.auditLogService = new AuditLogService();
    }

    private async getCompanyDetails() {
        const settings = await SystemSettingModel.find({
            key: {
                $in: [
                    SystemSettingKey.COMPANY_NAME,
                    SystemSettingKey.COMPANY_ADDRESS,
                    SystemSettingKey.COMPANY_EMAIL,
                    SystemSettingKey.COMPANY_PHONE,
                    SystemSettingKey.COMPANY_GSTIN,
                    SystemSettingKey.COMPANY_PAN,
                    SystemSettingKey.COMPANY_STATE_CODE,
                    SystemSettingKey.COMPANY_BANK_NAME,
                    SystemSettingKey.COMPANY_BANK_ACCOUNT,
                    SystemSettingKey.COMPANY_BANK_IFSC,
                    SystemSettingKey.COMPANY_UPI_ID,
                ],
            },
        }).lean();

        const map = new Map<string, any>();
        settings.forEach((s) => map.set(s.key, s.value));

        return {
            name: map.get(SystemSettingKey.COMPANY_NAME) || "Aaditya Softwares",
            address: map.get(SystemSettingKey.COMPANY_ADDRESS) || "Pune, Maharashtra, India",
            email: map.get(SystemSettingKey.COMPANY_EMAIL) || "contact@aadityasoftwares.in",
            phone: map.get(SystemSettingKey.COMPANY_PHONE) || "+91 9876543210",
            gstin: map.get(SystemSettingKey.COMPANY_GSTIN) || "27AAAAA0000A1Z5",
            pan: map.get(SystemSettingKey.COMPANY_PAN) || "AAAAA0000A",
            stateCode: map.get(SystemSettingKey.COMPANY_STATE_CODE) || "27",
            bankName: map.get(SystemSettingKey.COMPANY_BANK_NAME) || "",
            bankAccount: map.get(SystemSettingKey.COMPANY_BANK_ACCOUNT) || "",
            bankIfsc: map.get(SystemSettingKey.COMPANY_BANK_IFSC) || "",
            upiId: map.get(SystemSettingKey.COMPANY_UPI_ID) || "",
        };
    }

    async createInvoice(data: {
        clientId: string;
        quotationId?: string;
        items: IGstItemInput[];
        dueDate?: Date;
        paymentTerms?: string;
        notes?: string;
        currencyId?: string;
        exchangeRate?: number;
    }, userId?: string, context?: IAuditLogContext) {
        if (!data.clientId) {
            throw new AppError("Client ID is required.", 400);
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw new AppError("At least one invoice item is required.", 400);
        }

        const client = await this.clientService.getClientById(data.clientId);
        const company = await this.getCompanyDetails();

        const clientStateCode = client.billingAddress?.stateCode || "27";
        const clientCountryCode = client.billingAddress?.countryCode || "IN";

        const gstResult = GstUtil.calculateGst(data.items, company.stateCode, clientStateCode, clientCountryCode);
        const invoiceNumber = await SequenceCounterService.getNextSequence("INV");

        const dueDate = data.dueDate || new Date(Date.now() + 15 * 86400000);

        const clientAddress = [
            client.billingAddress?.street,
            client.billingAddress?.city,
            client.billingAddress?.state,
            client.billingAddress?.postalCode,
        ].filter(Boolean).join(", ");

        const invoice = await this.invoiceRepository.create({
            invoiceNumber,
            quotationId: data.quotationId ? new Types.ObjectId(data.quotationId) : (null as any),
            clientId: client._id,
            clientSnapshot: {
                name: client.name,
                companyName: client.companyName || "",
                email: client.email,
                phone: client.phone || "",
                gstin: client.gstin || "",
                pan: client.pan || "",
                address: clientAddress,
                stateCode: clientStateCode,
                countryCode: clientCountryCode,
            },
            currencyId: (data.currencyId || client.currencyId) as any,
            exchangeRate: data.exchangeRate || 1,
            items: gstResult.items,
            subTotal: gstResult.subTotal,
            totalDiscount: gstResult.totalDiscount,
            taxableAmount: gstResult.taxableAmount,
            cgstTotal: gstResult.cgstTotal,
            sgstTotal: gstResult.sgstTotal,
            igstTotal: gstResult.igstTotal,
            grandTotal: gstResult.grandTotal,
            paidAmount: 0,
            outstandingBalance: gstResult.grandTotal,
            isIntraState: gstResult.isIntraState,
            isExport: gstResult.isExport,
            issueDate: new Date(),
            dueDate,
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            status: InvoiceStatus.DRAFT,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        if (data.quotationId) {
            await QuotationModel.updateOne(
                { _id: new Types.ObjectId(data.quotationId) },
                {
                    $set: {
                        status: QuotationStatus.CONVERTED,
                        convertedInvoiceId: invoice._id,
                        convertedAt: new Date(),
                    },
                },
            ).exec();
        }

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.INVOICE,
            action: AuditLogAction.CREATE,
            resourceType: "Invoice",
            resourceId: invoice._id.toString(),
            resourceName: invoice.invoiceNumber,
            description: `Invoice '${invoice.invoiceNumber}' created for '${client.name}' for amount ${gstResult.grandTotal}.`,
        });

        return invoice;
    }

    async updateInvoice(id: string, data: Partial<IInvoice> & { items?: IGstItemInput[] }, userId?: string, context?: IAuditLogContext) {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }

        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new AppError("Cannot edit a cancelled invoice.", 400);
        }

        if (invoice.paidAmount > 0) {
            throw new AppError("Cannot edit invoice items after payments have been recorded against it.", 400);
        }

        const updateData: Partial<IInvoice> = { ...data, updatedBy: userId as any };

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const company = await this.getCompanyDetails();
            const clientStateCode = invoice.clientSnapshot?.stateCode || "27";
            const clientCountryCode = invoice.clientSnapshot?.countryCode || "IN";
            const gstResult = GstUtil.calculateGst(data.items, company.stateCode, clientStateCode, clientCountryCode);

            updateData.items = gstResult.items;
            updateData.subTotal = gstResult.subTotal;
            updateData.totalDiscount = gstResult.totalDiscount;
            updateData.taxableAmount = gstResult.taxableAmount;
            updateData.cgstTotal = gstResult.cgstTotal;
            updateData.sgstTotal = gstResult.sgstTotal;
            updateData.igstTotal = gstResult.igstTotal;
            updateData.grandTotal = gstResult.grandTotal;
            updateData.outstandingBalance = gstResult.grandTotal;
            updateData.isIntraState = gstResult.isIntraState;
            updateData.isExport = gstResult.isExport;
        }

        const updated = await this.invoiceRepository.update(id, updateData);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.INVOICE,
            action: AuditLogAction.UPDATE,
            resourceType: "Invoice",
            resourceId: id,
            resourceName: invoice.invoiceNumber,
            description: `Invoice '${invoice.invoiceNumber}' updated.`,
        });

        return updated;
    }

    async cancelInvoice(id: string, reason: string, userId?: string, context?: IAuditLogContext) {
        if (!reason || !reason.trim()) {
            throw new AppError("Cancellation reason is required.", 400);
        }

        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }

        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new AppError("Invoice is already cancelled.", 400);
        }

        if (invoice.paidAmount > 0) {
            throw new AppError("Cannot cancel an invoice with recorded payments. Reverse the payments first.", 400);
        }

        const updated = await this.invoiceRepository.update(id, {
            status: InvoiceStatus.CANCELLED,
            cancellationReason: reason.trim(),
            cancelledAt: new Date(),
            cancelledBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.INVOICE,
            action: AuditLogAction.CANCEL,
            resourceType: "Invoice",
            resourceId: id,
            resourceName: invoice.invoiceNumber,
            description: `Invoice '${invoice.invoiceNumber}' cancelled. Reason: ${reason}`,
        });

        return updated;
    }

    async generatePdf(id: string): Promise<Buffer> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }

        const company = await this.getCompanyDetails();

        return PdfUtil.generateInvoicePdf({
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            company,
            client: invoice.clientSnapshot,
            items: invoice.items,
            subTotal: invoice.subTotal,
            totalDiscount: invoice.totalDiscount,
            taxableAmount: invoice.taxableAmount,
            cgstTotal: invoice.cgstTotal,
            sgstTotal: invoice.sgstTotal,
            igstTotal: invoice.igstTotal,
            grandTotal: invoice.grandTotal,
            currencySymbol: (invoice.currencyId as any)?.symbol || "INR ",
            notes: invoice.notes,
            terms: invoice.paymentTerms,
        });
    }

    async sendEmailWithPdf(id: string, recipientEmail?: string, userId?: string, context?: IAuditLogContext) {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }

        const toEmail = recipientEmail || invoice.clientSnapshot.email;
        if (!toEmail) {
            throw new AppError("Recipient email is required.", 400);
        }

        const pdfBuffer = await this.generatePdf(id);

        const emailHtml = `
            <h2>Invoice from Aaditya Softwares</h2>
            <p>Dear ${invoice.clientSnapshot.name},</p>
            <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong> for the amount of <strong>${(invoice.currencyId as any)?.symbol || "INR "}${invoice.grandTotal.toFixed(2)}</strong>.</p>
            <p>Due Date: <strong>${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</strong></p>
            <p>Thank you for doing business with us!</p>
            <br>
            <p>Regards,<br><strong>Aaditya Softwares Team</strong></p>
        `;

        await sendEmail({
            to: toEmail,
            subject: `Invoice ${invoice.invoiceNumber} from Aaditya Softwares`,
            html: emailHtml,
            attachments: [
                {
                    filename: `${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        if (invoice.status === InvoiceStatus.DRAFT) {
            await this.invoiceRepository.update(id, { status: InvoiceStatus.SENT });
        }

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.INVOICE,
            action: AuditLogAction.UPDATE,
            resourceType: "Invoice",
            resourceId: id,
            resourceName: invoice.invoiceNumber,
            description: `Invoice '${invoice.invoiceNumber}' sent via email to '${toEmail}'.`,
        });

        return true;
    }

    async getInvoiceById(id: string) {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }
        return invoice;
    }

    async deleteInvoice(id: string, userId?: string, context?: IAuditLogContext) {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice not found.", 404);
        }

        if (invoice.paidAmount > 0) {
            throw new AppError("Cannot delete an invoice that has payments recorded against it.", 400);
        }

        await this.invoiceRepository.softDelete(id, userId);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.INVOICE,
            action: AuditLogAction.DELETE,
            resourceType: "Invoice",
            resourceId: id,
            resourceName: invoice.invoiceNumber,
            description: `Invoice '${invoice.invoiceNumber}' deleted.`,
        });

        return true;
    }

    async getInvoices(filter: IInvoiceFilter) {
        return this.invoiceRepository.findAll(filter);
    }
}

