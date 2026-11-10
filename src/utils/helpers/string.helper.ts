export class StringHelper {
    static normalize(value: string): string {
        return value.trim();
    }

    static normalizeUpper(value: string): string {
        return value.trim().toUpperCase();
    }

    static normalizeLower(value: string): string {
        return value.trim().toLowerCase();
    }

    static normalizeEmail(value: string): string {
        return value.trim().toLowerCase();
    }

    static normalizeCountryCode(value: string): string {
        return value.trim().toUpperCase();
    }

    static normalizeDialCode(value: string): string {
        return value.trim().replace(/^[+]/, "");
    }

    static normalizeCurrencyCode(value: string): string {
        return value.trim().toUpperCase();
    }

    static normalizeLocale(value: string): string {
        return value.trim();
    }

    static normalizeOptional(value?: string): string | undefined {
        return value?.trim();
    }

    static normalizeUpperOptional(value?: string): string | undefined {
        return value?.trim().toUpperCase();
    }

    static normalizeLowerOptional(value?: string): string | undefined {
        return value?.trim().toLowerCase();
    }

    static isEmpty(value?: string | null): boolean {
        return !value || value.trim().length === 0;
    }

    static isNotEmpty(value?: string | null): boolean {
        return !!value && value.trim().length > 0;
    }

    static emptyToUndefined(value?: string | null): string | undefined {
        if (!value) {
            return undefined;
        }

        const normalized = value.trim();

        return normalized.length > 0 ? normalized : undefined;
    }

    static emptyToNull(value?: string | null): string | null {
        if (!value) {
            return null;
        }

        const normalized = value.trim();

        return normalized.length > 0 ? normalized : null;
    }

    static slugify(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    static titleCase(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, (character) => character.toUpperCase());
    }

    static camelCase(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[-_\s]+(.)?/g, (_, character: string) => (character ? character.toUpperCase() : ""));
    }

    static pascalCase(value: string): string {
        const camel = this.camelCase(value);

        return camel.length > 0 ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel;
    }

    static removeWhitespace(value: string): string {
        return value.replace(/\s+/g, "");
    }

    static normalizeWhitespace(value: string): string {
        return value.trim().replace(/\s+/g, " ");
    }

    static removeSpecialCharacters(value: string): string {
        return value.replace(/[^a-zA-Z0-9\s]/g, "");
    }

    static numbersOnly(value: string): string {
        return value.replace(/\D/g, "");
    }

    static lettersOnly(value: string): string {
        return value.replace(/[^a-zA-Z]/g, "");
    }

    static alphanumericOnly(value: string): string {
        return value.replace(/[^a-zA-Z0-9]/g, "");
    }

    static truncate(value: string, maxLength: number, suffix = "..."): string {
        if (value.length <= maxLength) {
            return value;
        }

        return `${value.slice(0, maxLength)}${suffix}`;
    }

    static mask(value: string, visibleStart = 2, visibleEnd = 2, maskChar = "*"): string {
        if (value.length <= visibleStart + visibleEnd) {
            return value;
        }

        const start = value.slice(0, visibleStart);
        const end = value.slice(-visibleEnd);
        const masked = maskChar.repeat(value.length - visibleStart - visibleEnd);

        return `${start}${masked}${end}`;
    }
}
