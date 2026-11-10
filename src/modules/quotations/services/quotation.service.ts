import { QuotationRepository } from "../repositories/quotation.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { SequenceCounterService } from "../../../services/sequenceCounter.service.js";
import { QuotationStatus } from "../constants/quotation.enums.js";
import type { IQuotation, IQuotationFilter } from "../interfaces/quotation.interface.js";
import { ClientService } from "../../clients/services/client.service.js";
import { GstUtil, type IGstItemInput } from "../../../utils/gst.util.js";
import { PdfUtil } from "../../../utils/pdf.util.js";
import { SystemSettingModel } from "../../systemsettings/models/systemSetting.model.js";
import { SystemSettingKey } from "../../systemsettings/constants/systemSetting.enums.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class QuotationService {
    private quotationRepository: QuotationRepository;
    private clientService: ClientService;
    private auditLogService: AuditLogService;

    constructor() {
        this.quotationRepository = new QuotationRepository();
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
            email: map.get(SystemSettingKey.COMPANY_EMAIL) || "contact@aadityasoftwares.fun",
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

    async createQuotation(data: {
        clientId: string;
        enquiryId?: string;
        items: IGstItemInput[];
        validUntil?: Date;
        paymentTerms?: string;
        notes?: string;
        currencyId?: string;
    }, userId?: string, context?: IAuditLogContext) {
        if (!data.clientId) {
            throw new AppError("Client ID is required.", 400);
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw new AppError("At least one quotation item is required.", 400);
        }

        const client = await this.clientService.getClientById(data.clientId);
        const company = await this.getCompanyDetails();

        const clientStateCode = client.billingAddress?.stateCode || "27";
        const clientCountryCode = client.billingAddress?.countryCode || "IN";

        const gstResult = GstUtil.calculateGst(data.items, company.stateCode, clientStateCode, clientCountryCode);

        const quotationNumber = await SequenceCounterService.getNextSequence("QT");

        const quotation = await this.quotationRepository.create({
            quotationNumber,
            clientId: client._id,
            enquiryId: data.enquiryId as any,
            currencyId: (data.currencyId || client.currencyId) as any,
            items: gstResult.items,
            subTotal: gstResult.subTotal,
            totalDiscount: gstResult.totalDiscount,
            taxableAmount: gstResult.taxableAmount,
            cgstTotal: gstResult.cgstTotal,
            sgstTotal: gstResult.sgstTotal,
            igstTotal: gstResult.igstTotal,
            grandTotal: gstResult.grandTotal,
            isIntraState: gstResult.isIntraState,
            isExport: gstResult.isExport,
            validUntil: data.validUntil,
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            status: QuotationStatus.DRAFT,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.QUOTATION,
            action: AuditLogAction.CREATE,
            resourceType: "Quotation",
            resourceId: quotation._id.toString(),
            resourceName: quotation.quotationNumber,
            description: `Quotation '${quotation.quotationNumber}' created for '${client.name}'.`,
        });

        return quotation;
    }

    async updateQuotation(id: string, data: Partial<IQuotation> & { items?: IGstItemInput[] }, userId?: string, context?: IAuditLogContext) {
        const quotation = await this.quotationRepository.findById(id);
        if (!quotation) {
            throw new AppError("Quotation not found.", 404);
        }

        if (quotation.status === QuotationStatus.CONVERTED) {
            throw new AppError("Cannot edit a quotation that has already been converted to an invoice.", 400);
        }

        const updateData: Partial<IQuotation> = { ...data, updatedBy: userId as any };

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const client = await this.clientService.getClientById(quotation.clientId._id.toString());
            const company = await this.getCompanyDetails();
            const clientStateCode = client.billingAddress?.stateCode || "27";
            const clientCountryCode = client.billingAddress?.countryCode || "IN";
            const gstResult = GstUtil.calculateGst(data.items, company.stateCode, clientStateCode, clientCountryCode);

            updateData.items = gstResult.items;
            updateData.subTotal = gstResult.subTotal;
            updateData.totalDiscount = gstResult.totalDiscount;
            updateData.taxableAmount = gstResult.taxableAmount;
            updateData.cgstTotal = gstResult.cgstTotal;
            updateData.sgstTotal = gstResult.sgstTotal;
            updateData.igstTotal = gstResult.igstTotal;
            updateData.grandTotal = gstResult.grandTotal;
            updateData.isIntraState = gstResult.isIntraState;
            updateData.isExport = gstResult.isExport;
        }

        const updated = await this.quotationRepository.update(id, updateData);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.QUOTATION,
            action: AuditLogAction.UPDATE,
            resourceType: "Quotation",
            resourceId: id,
            resourceName: quotation.quotationNumber,
            description: `Quotation '${quotation.quotationNumber}' updated.`,
        });

        return updated;
    }

    async generatePdf(id: string): Promise<Buffer> {
        const quotation = await this.quotationRepository.findById(id);
        if (!quotation) {
            throw new AppError("Quotation not found.", 404);
        }

        const company = await this.getCompanyDetails();
        const client = quotation.clientId as any;

        return PdfUtil.generateQuotationPdf({
            invoiceNumber: quotation.quotationNumber,
            issueDate: quotation.createdAt || new Date(),
            dueDate: quotation.validUntil || new Date(Date.now() + 15 * 86400000),
            company,
            client: {
                name: client.name,
                companyName: client.companyName,
                email: client.email,
                phone: client.phone,
                gstin: client.gstin,
                address: [client.billingAddress?.street, client.billingAddress?.city, client.billingAddress?.state, client.billingAddress?.postalCode].filter(Boolean).join(", "),
            },
            items: quotation.items,
            subTotal: quotation.subTotal,
            totalDiscount: quotation.totalDiscount,
            taxableAmount: quotation.taxableAmount,
            cgstTotal: quotation.cgstTotal,
            sgstTotal: quotation.sgstTotal,
            igstTotal: quotation.igstTotal,
            grandTotal: quotation.grandTotal,
            currencySymbol: (quotation.currencyId as any)?.symbol || "INR ",
            notes: quotation.notes,
            terms: quotation.paymentTerms,
        });
    }

    async getQuotationById(id: string) {
        const quotation = await this.quotationRepository.findById(id);
        if (!quotation) {
            throw new AppError("Quotation not found.", 404);
        }
        return quotation;
    }

    async deleteQuotation(id: string, userId?: string, context?: IAuditLogContext) {
        const quotation = await this.quotationRepository.findById(id);
        if (!quotation) {
            throw new AppError("Quotation not found.", 404);
        }

        await this.quotationRepository.softDelete(id, userId);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.QUOTATION,
            action: AuditLogAction.DELETE,
            resourceType: "Quotation",
            resourceId: id,
            resourceName: quotation.quotationNumber,
            description: `Quotation '${quotation.quotationNumber}' deleted.`,
        });

        return true;
    }

    async getQuotations(filter: IQuotationFilter) {
        return this.quotationRepository.findAll(filter);
    }
}

