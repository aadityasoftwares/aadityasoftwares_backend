import { ClientRepository } from "../repositories/client.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { ClientMessages } from "../constants/client.messages.js";
import type { IClient, IClientFilter } from "../interfaces/client.interface.js";
import { GstUtil } from "../../../utils/gst.util.js";
import { getStateByCode } from "../../states/constants/state.constants.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class ClientService {
    private clientRepository: ClientRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.clientRepository = new ClientRepository();
        this.auditLogService = new AuditLogService();
    }

    async createClient(data: Partial<IClient>, userId?: string, context?: IAuditLogContext) {
        if (!data.name || !data.name.trim()) {
            throw new AppError(ClientMessages.NAME_REQUIRED, 400);
        }
        if (!data.email || !data.email.trim()) {
            throw new AppError(ClientMessages.EMAIL_REQUIRED, 400);
        }

        const normalizedEmail = data.email.toLowerCase().trim();
        const existingEmail = await this.clientRepository.findByEmail(normalizedEmail);
        if (existingEmail) {
            throw new AppError(ClientMessages.EMAIL_EXISTS, 409);
        }

        if (data.gstin && data.gstin.trim()) {
            const formattedGstin = data.gstin.toUpperCase().trim();
            if (!GstUtil.validateGstin(formattedGstin)) {
                throw new AppError(ClientMessages.INVALID_GSTIN, 400);
            }
            const existingGstin = await this.clientRepository.findByGstin(formattedGstin);
            if (existingGstin) {
                throw new AppError(ClientMessages.GSTIN_EXISTS, 409);
            }
            data.gstin = formattedGstin;

            // Auto-extract state and PAN
            const stateCode = GstUtil.extractStateCodeFromGstin(formattedGstin);
            if (stateCode) {
                const state = getStateByCode(stateCode);
                data.billingAddress = {
                    ...data.billingAddress,
                    stateCode,
                    state: state?.name || data.billingAddress?.state,
                };
            }
            if (!data.pan) {
                data.pan = formattedGstin.substring(2, 12);
            }
        }

        const client = await this.clientRepository.create({
            ...data,
            email: normalizedEmail,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.CLIENT,
            action: AuditLogAction.CREATE,
            resourceType: "Client",
            resourceId: client._id.toString(),
            resourceName: client.name,
            description: `Client '${client.name}' was created.`,
        });

        return client;
    }

    async updateClient(id: string, data: Partial<IClient>, userId?: string, context?: IAuditLogContext) {
        const client = await this.clientRepository.findById(id);
        if (!client) {
            throw new AppError(ClientMessages.NOT_FOUND, 404);
        }

        if (data.email && data.email.toLowerCase().trim() !== client.email) {
            const normalizedEmail = data.email.toLowerCase().trim();
            const existingEmail = await this.clientRepository.findByEmail(normalizedEmail);
            if (existingEmail && existingEmail._id.toString() !== id) {
                throw new AppError(ClientMessages.EMAIL_EXISTS, 409);
            }
            data.email = normalizedEmail;
        }

        if (data.gstin && data.gstin.trim()) {
            const formattedGstin = data.gstin.toUpperCase().trim();
            if (!GstUtil.validateGstin(formattedGstin)) {
                throw new AppError(ClientMessages.INVALID_GSTIN, 400);
            }
            const existingGstin = await this.clientRepository.findByGstin(formattedGstin);
            if (existingGstin && existingGstin._id.toString() !== id) {
                throw new AppError(ClientMessages.GSTIN_EXISTS, 409);
            }
            data.gstin = formattedGstin;
            const stateCode = GstUtil.extractStateCodeFromGstin(formattedGstin);
            if (stateCode) {
                const state = getStateByCode(stateCode);
                data.billingAddress = {
                    ...client.billingAddress,
                    ...data.billingAddress,
                    stateCode,
                    state: state?.name || data.billingAddress?.state,
                };
            }
            if (!data.pan) {
                data.pan = formattedGstin.substring(2, 12);
            }
        }

        const updated = await this.clientRepository.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.CLIENT,
            action: AuditLogAction.UPDATE,
            resourceType: "Client",
            resourceId: id,
            resourceName: updated?.name || client.name,
            description: `Client '${updated?.name || client.name}' was updated.`,
        });

        return updated;
    }

    async getClientById(id: string) {
        const client = await this.clientRepository.findById(id);
        if (!client) {
            throw new AppError(ClientMessages.NOT_FOUND, 404);
        }
        return client;
    }

    async deleteClient(id: string, userId?: string, context?: IAuditLogContext) {
        const client = await this.clientRepository.findById(id);
        if (!client) {
            throw new AppError(ClientMessages.NOT_FOUND, 404);
        }

        await this.clientRepository.softDelete(id, userId);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.CLIENT,
            action: AuditLogAction.DELETE,
            resourceType: "Client",
            resourceId: id,
            resourceName: client.name,
            description: `Client '${client.name}' was deleted.`,
        });

        return true;
    }

    async getClients(filter: IClientFilter) {
        return this.clientRepository.findAll(filter);
    }
}

