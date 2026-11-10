export interface IGstItemInput {
    description: string;
    hsnSacCode?: string;
    quantity: number;
    unitRate: number;
    discountAmount?: number;
    gstRate: number; // e.g. 18 for 18%
}

export interface ICalculatedGstItem {
    description: string;
    hsnSacCode: string;
    quantity: number;
    unitRate: number;
    grossAmount: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalAmount: number;
}

export interface IGstCalculationResult {
    isIntraState: boolean;
    isExport: boolean;
    items: ICalculatedGstItem[];
    subTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    taxTotal: number;
    grandTotal: number;
}

export class GstUtil {
    private static round(value: number): number {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    static calculateGst(
        items: IGstItemInput[],
        companyStateCode: string = "27",
        clientStateCode: string = "27",
        clientCountryCode: string = "IN",
    ): IGstCalculationResult {
        const isExport = clientCountryCode.toUpperCase() !== "IN";
        const isIntraState = !isExport && String(companyStateCode).trim() === String(clientStateCode).trim();

        let subTotal = 0;
        let totalDiscount = 0;
        let taxableAmount = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        const calculatedItems: ICalculatedGstItem[] = items.map((item) => {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const rate = Math.max(0, Number(item.unitRate) || 0);
            const gross = this.round(qty * rate);
            const discount = this.round(Math.min(gross, Math.max(0, Number(item.discountAmount) || 0)));
            const taxable = this.round(gross - discount);
            const gstRate = Math.max(0, Number(item.gstRate) || 0);

            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let igstRate = 0;
            let igstAmount = 0;

            if (!isExport) {
                if (isIntraState) {
                    cgstRate = this.round(gstRate / 2);
                    sgstRate = this.round(gstRate / 2);
                    cgstAmount = this.round((taxable * cgstRate) / 100);
                    sgstAmount = this.round((taxable * sgstRate) / 100);
                } else {
                    igstRate = gstRate;
                    igstAmount = this.round((taxable * igstRate) / 100);
                }
            }

            const itemTotal = this.round(taxable + cgstAmount + sgstAmount + igstAmount);

            subTotal = this.round(subTotal + gross);
            totalDiscount = this.round(totalDiscount + discount);
            taxableAmount = this.round(taxableAmount + taxable);
            cgstTotal = this.round(cgstTotal + cgstAmount);
            sgstTotal = this.round(sgstTotal + sgstAmount);
            igstTotal = this.round(igstTotal + igstAmount);

            return {
                description: item.description,
                hsnSacCode: item.hsnSacCode || "",
                quantity: qty,
                unitRate: rate,
                grossAmount: gross,
                discountAmount: discount,
                taxableAmount: taxable,
                gstRate,
                cgstRate,
                cgstAmount,
                sgstRate,
                sgstAmount,
                igstRate,
                igstAmount,
                totalAmount: itemTotal,
            };
        });

        const taxTotal = this.round(cgstTotal + sgstTotal + igstTotal);
        const grandTotal = this.round(taxableAmount + taxTotal);

        return {
            isIntraState,
            isExport,
            items: calculatedItems,
            subTotal,
            totalDiscount,
            taxableAmount,
            cgstTotal,
            sgstTotal,
            igstTotal,
            taxTotal,
            grandTotal,
        };
    }

    static validateGstin(gstin: string): boolean {
        if (!gstin) return false;
        const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gstin.trim().toUpperCase());
    }

    static extractStateCodeFromGstin(gstin: string): string | null {
        if (!this.validateGstin(gstin)) return null;
        return gstin.trim().substring(0, 2);
    }
}

