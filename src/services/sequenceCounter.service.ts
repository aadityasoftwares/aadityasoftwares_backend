import { CounterModel } from "../models/counter.model.js";

export class SequenceCounterService {
    /**
     * Generates a monthly sequential code, e.g. INV-202611-0001
     * Atomic via findOneAndUpdate with $inc.
     */
    static async getNextSequence(prefix: string, date = new Date()): Promise<string> {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const periodKey = `${prefix.toUpperCase()}-${year}${month}`;

        const counter = await CounterModel.findOneAndUpdate(
            { key: periodKey },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true },
        ).exec();

        const sequenceNumber = String(counter.sequence).padStart(4, "0");
        return `${periodKey}-${sequenceNumber}`;
    }
}

