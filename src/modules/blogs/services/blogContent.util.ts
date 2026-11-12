/**
 * Blog Content Helper: extracts plain text, calculates word count, and estimates reading time.
 */
export class BlogContentUtil {
    /**
     * Extracts readable text from either a string or structured JSON content (such as EditorJS, Quill, or Lexical).
     */
    static extractPlainText(content: any): string {
        if (!content) return "";

        if (typeof content === "string") {
            // Strip HTML tags and entities
            return content
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/\s+/g, " ")
                .trim();
        }

        if (typeof content === "object") {
            const texts: string[] = [];

            const traverse = (node: any) => {
                if (!node) return;
                if (typeof node === "string") {
                    texts.push(node);
                    return;
                }
                if (Array.isArray(node)) {
                    node.forEach(traverse);
                    return;
                }
                if (typeof node === "object") {
                    // Common editor formats: { text: "..." }, { insert: "..." }, { blocks: [...] }
                    if (typeof node.text === "string") texts.push(node.text);
                    if (typeof node.insert === "string") texts.push(node.insert);
                    if (typeof node.data?.text === "string") texts.push(node.data.text);
                    for (const key of Object.keys(node)) {
                        if (key !== "text" && key !== "insert" && key !== "data") {
                            traverse(node[key]);
                        }
                    }
                }
            };

            traverse(content);
            return texts.join(" ").replace(/\s+/g, " ").trim();
        }

        return "";
    }

    /**
     * Calculates word count from content.
     */
    static calculateWordCount(content: any): number {
        const text = this.extractPlainText(content);
        if (!text) return 0;
        const words = text.match(/\b\S+\b/g);
        return words ? words.length : 0;
    }

    /**
     * Estimates reading time in minutes (assuming average reading speed of 200 words per minute).
     */
    static calculateReadingTime(content: any): number {
        const wordCount = this.calculateWordCount(content);
        if (wordCount === 0) return 1;
        const minutes = Math.ceil(wordCount / 200);
        return Math.max(1, minutes);
    }

    /**
     * Sanitizes string / HTML input against dangerous injection.
     */
    static sanitizeHtml(input: string): string {
        if (!input || typeof input !== "string") return "";
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/onload\s*=/gi, "")
            .replace(/onerror\s*=/gi, "")
            .replace(/onclick\s*=/gi, "");
    }
}

