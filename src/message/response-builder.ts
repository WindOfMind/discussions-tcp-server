export class ResponseBuilder {
    constructor(private readonly options = { withEndLine: true }) {}

    private parts: string[] = [];

    with(part: string, escape: boolean = false): ResponseBuilder {
        this.parts.push(escape ? this.escape(part) : part);

        return this;
    }

    withList(parts: string[]): ResponseBuilder {
        if (parts.length === 0) {
            return this;
        }

        this.parts.push(`(${parts.join(",")})`);

        return this;
    }

    build(): string {
        return this.parts.join("|") + (this.options.withEndLine ? "\n" : "");
    }

    private escape = (str: string): string => {
        const escaped = str.replaceAll('"', '""');

        if (escaped.includes(",")) {
            return `"${escaped}"`;
        }

        return escaped;
    };
}
