import { EnquiryRepository } from "../repositories/enquiry.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { SequenceCounterService } from "../../../services/sequenceCounter.service.js";
import { EnquiryStatus } from "../constants/enquiry.enums.js";
import type { IEnquiry, IEnquiryFilter } from "../interfaces/enquiry.interface.js";
import { ClientService } from "../../clients/services/client.service.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { Types } from "mongoose";

export class EnquiryService {
    private enquiryRepository: EnquiryRepository;
    private clientService: ClientService;
    private auditLogService: AuditLogService;

    constructor() {
        this.enquiryRepository = new EnquiryRepository();
        this.clientService = new ClientService();
        this.auditLogService = new AuditLogService();
    }

    async createEnquiry(data: Partial<IEnquiry>, userId?: string, context?: IAuditLogContext) {
        if (!data.prospectName || !data.prospectName.trim()) {
            throw new AppError("Prospect name is required.", 400);
        }
        if (!data.prospectEmail || !data.prospectEmail.trim()) {
            throw new AppError("Prospect email is required.", 400);
        }
        if (!data.projectTitle || !data.projectTitle.trim()) {
            throw new AppError("Project title is required.", 400);
        }
        if (!data.projectRequirements || !data.projectRequirements.trim()) {
            throw new AppError("Project requirements are required.", 400);
        }

        const enquiryNumber = await SequenceCounterService.getNextSequence("ENQ");

        const enquiry = await this.enquiryRepository.create({
            ...data,
            enquiryNumber,
            prospectEmail: data.prospectEmail.toLowerCase().trim(),
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY,
            action: AuditLogAction.CREATE,
            resourceType: "Enquiry",
            resourceId: enquiry._id.toString(),
            resourceName: enquiry.enquiryNumber,
            description: `Enquiry '${enquiry.enquiryNumber}' created for '${enquiry.prospectName}'.`,
        });

        return enquiry;
    }

    async updateEnquiry(id: string, data: Partial<IEnquiry>, userId?: string, context?: IAuditLogContext) {
        const enquiry = await this.enquiryRepository.findById(id);
        if (!enquiry) {
            throw new AppError("Enquiry not found.", 404);
        }

        const updated = await this.enquiryRepository.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY,
            action: AuditLogAction.UPDATE,
            resourceType: "Enquiry",
            resourceId: id,
            resourceName: enquiry.enquiryNumber,
            description: `Enquiry '${enquiry.enquiryNumber}' updated.`,
        });

        return updated;
    }

    async assignEnquiry(id: string, assignedTo: string, userId?: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(assignedTo)) {
            throw new AppError("Invalid employee user ID.", 400);
        }

        const enquiry = await this.enquiryRepository.findById(id);
        if (!enquiry) {
            throw new AppError("Enquiry not found.", 404);
        }

        const updated = await this.enquiryRepository.update(id, {
            assignedTo: new Types.ObjectId(assignedTo),
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY,
            action: AuditLogAction.ASSIGN,
            resourceType: "Enquiry",
            resourceId: id,
            resourceName: enquiry.enquiryNumber,
            description: `Enquiry '${enquiry.enquiryNumber}' assigned to employee '${assignedTo}'.`,
        });

        return updated;
    }

    async convertToClient(id: string, userId?: string, context?: IAuditLogContext) {
        const enquiry = await this.enquiryRepository.findById(id);
        if (!enquiry) {
            throw new AppError("Enquiry not found.", 404);
        }

        if (enquiry.convertedClientId) {
            throw new AppError("Enquiry has already been converted to a client.", 400);
        }

        let client = enquiry.clientId ? await this.clientService.getClientById(enquiry.clientId.toString()) : null;

        if (!client) {
            client = await this.clientService.createClient(
                {
                    name: enquiry.prospectName,
                    companyName: enquiry.companyName || enquiry.prospectName,
                    email: enquiry.prospectEmail,
                    phone: enquiry.prospectPhone || "",
                    currencyId: enquiry.currencyId,
                },
                userId,
                context,
            );
        }

        const updated = await this.enquiryRepository.update(id, {
            status: EnquiryStatus.WON,
            clientId: client._id,
            convertedClientId: client._id,
            convertedAt: new Date(),
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY,
            action: AuditLogAction.CONVERTED,
            resourceType: "Enquiry",
            resourceId: id,
            resourceName: enquiry.enquiryNumber,
            description: `Enquiry '${enquiry.enquiryNumber}' converted to Client '${client.name}'.`,
        });

        return {
            enquiry: updated,
            client,
        };
    }

    async getEnquiryById(id: string) {
        const enquiry = await this.enquiryRepository.findById(id);
        if (!enquiry) {
            throw new AppError("Enquiry not found.", 404);
        }
        return enquiry;
    }

    async deleteEnquiry(id: string, userId?: string, context?: IAuditLogContext) {
        const enquiry = await this.enquiryRepository.findById(id);
        if (!enquiry) {
            throw new AppError("Enquiry not found.", 404);
        }

        await this.enquiryRepository.softDelete(id, userId);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY,
            action: AuditLogAction.DELETE,
            resourceType: "Enquiry",
            resourceId: id,
            resourceName: enquiry.enquiryNumber,
            description: `Enquiry '${enquiry.enquiryNumber}' was deleted.`,
        });

        return true;
    }

    async getEnquiries(filter: IEnquiryFilter) {
        return this.enquiryRepository.findAll(filter);
    }
}

