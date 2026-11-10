import { Types } from "mongoose";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { PaymentModel } from "../models/payment.model.js";
import { InvoiceModel } from "../../invoices/models/invoice.model.js";
import { InvoiceStatus } from "../../invoices/constants/invoice.enums.js";
import { PaymentMethod, PaymentStatus } from "../constants/payment.enums.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { SequenceCounterService } from "../../../services/sequenceCounter.service.js";
import { runMongoTransaction } from "../../../utils/mongoTransaction.util.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import type { IPaymentFilter } from "../interfaces/payment.interface.js";

export class PaymentService {
    private paymentRepository: PaymentRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.paymentRepository = new PaymentRepository();
        this.auditLogService = new AuditLogService();
    }

    async recordPayment(data: {
        invoiceId: string;
        amount: number;
        paymentDate?: Date;
        paymentMethod?: PaymentMethod;
        transactionReference?: string;
        notes?: string;
    }, userId: string, context?: IAuditLogContext) {
        if (!data.invoiceId || !Types.ObjectId.isValid(data.invoiceId)) {
            throw new AppError("Valid invoice ID is required.", 400);
        }

        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new AppError("Payment amount must be greater than zero.", 400);
        }

        const invoice = await InvoiceModel.findById(data.invoiceId).exec();
        if (!invoice || invoice.isDeleted) {
            throw new AppError("Invoice not found.", 404);
        }

        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new AppError("Cannot record payments on a cancelled invoice.", 400);
        }

        if (amount > invoice.outstandingBalance + 0.01) {
            throw new AppError(
                `Payment amount (${amount}) exceeds the invoice outstanding balance (${invoice.outstandingBalance}).`,
                400,
            );
        }

        const paymentNumber = await SequenceCounterService.getNextSequence("PAY");

        return runMongoTransaction(async (session) => {
            const [payment] = await PaymentModel.create(
                [
                    {
                        paymentNumber,
                        invoiceId: invoice._id,
                        clientId: invoice.clientId,
                        amount,
                        currencyId: invoice.currencyId,
                        paymentDate: data.paymentDate || new Date(),
                        paymentMethod: data.paymentMethod || PaymentMethod.BANK_TRANSFER,
                        transactionReference: data.transactionReference || "",
                        notes: data.notes || "",
                        status: PaymentStatus.COMPLETED,
                        recordedBy: new Types.ObjectId(userId),
                    },
                ],
                { session },
            );

            const newPaidAmount = Math.round((invoice.paidAmount + amount) * 100) / 100;
            const newOutstandingBalance = Math.max(0, Math.round((invoice.grandTotal - newPaidAmount) * 100) / 100);
            const newStatus = newOutstandingBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

            await InvoiceModel.updateOne(
                { _id: invoice._id },
                {
                    $set: {
                        paidAmount: newPaidAmount,
                        outstandingBalance: newOutstandingBalance,
                        status: newStatus,
                        updatedBy: new Types.ObjectId(userId),
                    },
                },
                { session },
            );

            await this.auditLogService.log({
                ...(context || {}),
                module: AppModule.PAYMENT,
                action: AuditLogAction.PAYMENT_RECORDED,
                resourceType: "Payment",
                resourceId: payment._id.toString(),
                resourceName: payment.paymentNumber,
                description: `Payment '${payment.paymentNumber}' of ${amount} recorded against invoice '${invoice.invoiceNumber}'.`,
            });

            return payment;
        });
    }

    async reversePayment(id: string, reason: string, userId: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid payment ID.", 400);
        }
        if (!reason || !reason.trim()) {
            throw new AppError("Payment reversal reason is required.", 400);
        }

        const payment = await PaymentModel.findById(id).exec();
        if (!payment) {
            throw new AppError("Payment not found.", 404);
        }

        if (payment.status === PaymentStatus.REVERSED) {
            throw new AppError("Payment has already been reversed.", 400);
        }

        const invoice = await InvoiceModel.findById(payment.invoiceId).exec();
        if (!invoice) {
            throw new AppError("Related invoice not found.", 404);
        }

        return runMongoTransaction(async (session) => {
            await PaymentModel.updateOne(
                { _id: payment._id },
                {
                    $set: {
                        status: PaymentStatus.REVERSED,
                        reversalReason: reason.trim(),
                        reversedAt: new Date(),
                        reversedBy: new Types.ObjectId(userId),
                    },
                },
                { session },
            );

            const activePayments = await PaymentModel.find({
                invoiceId: invoice._id,
                status: PaymentStatus.COMPLETED,
                _id: { $ne: payment._id },
            })
                .session(session || null)
                .exec();

            const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);
            const newPaidAmount = Math.round(totalPaid * 100) / 100;
            const newOutstandingBalance = Math.max(0, Math.round((invoice.grandTotal - newPaidAmount) * 100) / 100);

            let newStatus = InvoiceStatus.SENT;
            if (newPaidAmount > 0 && newOutstandingBalance > 0) {
                newStatus = InvoiceStatus.PARTIALLY_PAID;
            } else if (newOutstandingBalance <= 0 && newPaidAmount > 0) {
                newStatus = InvoiceStatus.PAID;
            }

            await InvoiceModel.updateOne(
                { _id: invoice._id },
                {
                    $set: {
                        paidAmount: newPaidAmount,
                        outstandingBalance: newOutstandingBalance,
                        status: newStatus,
                        updatedBy: new Types.ObjectId(userId),
                    },
                },
                { session },
            );

            await this.auditLogService.log({
                ...(context || {}),
                module: AppModule.PAYMENT,
                action: AuditLogAction.PAYMENT_REVERSED,
                resourceType: "Payment",
                resourceId: id,
                resourceName: payment.paymentNumber,
                description: `Payment '${payment.paymentNumber}' was reversed. Reason: ${reason}.`,
            });

            return { success: true, message: "Payment reversed successfully." };
        });
    }

    async getPaymentById(id: string) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment) {
            throw new AppError("Payment not found.", 404);
        }
        return payment;
    }

    async getPaymentsForInvoice(invoiceId: string) {
        return this.paymentRepository.findByInvoiceId(invoiceId);
    }

    async getPayments(filter: IPaymentFilter) {
        return this.paymentRepository.findAll(filter);
    }
}

