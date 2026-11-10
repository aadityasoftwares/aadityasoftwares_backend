export interface IIndianState {
    name: string;
    code: string; // 2-digit GST state code
    tin: string;
}

export const INDIAN_STATES: readonly IIndianState[] = [
    { name: "Jammu and Kashmir", code: "01", tin: "01" },
    { name: "Himachal Pradesh", code: "02", tin: "02" },
    { name: "Punjab", code: "03", tin: "03" },
    { name: "Chandigarh", code: "04", tin: "04" },
    { name: "Uttarakhand", code: "05", tin: "05" },
    { name: "Haryana", code: "06", tin: "06" },
    { name: "Delhi", code: "07", tin: "07" },
    { name: "Rajasthan", code: "08", tin: "08" },
    { name: "Uttar Pradesh", code: "09", tin: "09" },
    { name: "Bihar", code: "10", tin: "10" },
    { name: "Sikkim", code: "11", tin: "11" },
    { name: "Arunachal Pradesh", code: "12", tin: "12" },
    { name: "Nagaland", code: "13", tin: "13" },
    { name: "Manipur", code: "14", tin: "14" },
    { name: "Mizoram", code: "15", tin: "15" },
    { name: "Tripura", code: "16", tin: "16" },
    { name: "Meghalaya", code: "17", tin: "17" },
    { name: "Assam", code: "18", tin: "18" },
    { name: "West Bengal", code: "19", tin: "19" },
    { name: "Jharkhand", code: "20", tin: "20" },
    { name: "Odisha", code: "21", tin: "21" },
    { name: "Chhattisgarh", code: "22", tin: "22" },
    { name: "Madhya Pradesh", code: "23", tin: "23" },
    { name: "Gujarat", code: "24", tin: "24" },
    { name: "Dadra and Nagar Haveli and Daman and Diu", code: "26", tin: "26" },
    { name: "Maharashtra", code: "27", tin: "27" },
    { name: "Karnataka", code: "29", tin: "29" },
    { name: "Goa", code: "30", tin: "30" },
    { name: "Lakshadweep", code: "31", tin: "31" },
    { name: "Kerala", code: "32", tin: "32" },
    { name: "Tamil Nadu", code: "33", tin: "33" },
    { name: "Puducherry", code: "34", tin: "34" },
    { name: "Andaman and Nicobar Islands", code: "35", tin: "35" },
    { name: "Telangana", code: "36", tin: "36" },
    { name: "Andhra Pradesh", code: "37", tin: "37" },
    { name: "Ladakh", code: "38", tin: "38" },
    { name: "Other Territory", code: "97", tin: "97" },
] as const;

export function getStateByCode(code: string): IIndianState | undefined {
    const formatted = String(code).trim().padStart(2, "0");
    return INDIAN_STATES.find((s) => s.code === formatted);
}

export function getStateByName(name: string): IIndianState | undefined {
    const normalized = name.trim().toLowerCase();
    return INDIAN_STATES.find((s) => s.name.toLowerCase() === normalized);
}

