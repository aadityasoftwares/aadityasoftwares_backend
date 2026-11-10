import { Types } from "mongoose";
import { EnquiryFollowUpModel, type IEnquiryFollowUp } from "../models/enquiryFollowUp.model.js";
import { EnquiryModel } from "../../enquiries/models/enquiry.model.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class EnquiryFollowUpService {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    async createFollowUp(data: Partial<IEnquiryFollowUp>, userId: string, context?: IAuditLogContext) {
        if (!data.enquiryId || !Types.ObjectId.isValid(data.enquiryId as any)) {
            throw new AppError("Valid enquiry ID is required.", 400);
        }
        if (!data.summary || !data.summary.trim()) {
            throw new AppError("Follow-up summary is required.", 400);
        }

        const enquiry = await EnquiryModel.findById(data.enquiryId).exec();
        if (!enquiry || enquiry.isDeleted) {
            throw new AppError("Enquiry not found.", 404);
        }

        const followUp = await EnquiryFollowUpModel.create({
            ...data,
            performedBy: new Types.ObjectId(userId),
        });

        if (data.nextFollowUpDate) {
            await EnquiryModel.updateOne(
                { _id: data.enquiryId },
                { $set: { followUpDate: new Date(data.nextFollowUpDate) } },
            ).exec();
        }

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.ENQUIRY_FOLLOW_UP,
            action: AuditLogAction.CREATE,
            resourceType: "EnquiryFollowUp",
            resourceId: followUp._id.toString(),
            resourceName: enquiry.enquiryNumber,
            description: `Follow-up logged for enquiry '${enquiry.enquiryNumber}'.`,
        });

        return followUp;
    }

    async getFollowUpsForEnquiry(enquiryId: string) {
        if (!Types.ObjectId.isValid(enquiryId)) {
            throw new AppError("Invalid enquiry ID.", 400);
        }
        return EnquiryFollowUpModel.find({ enquiryId: new Types.ObjectId(enquiryId) })
            .populate("performedBy", "email")
            .sort({ scheduledAt: -1 })
            .lean()
            .exec();
    }
}

