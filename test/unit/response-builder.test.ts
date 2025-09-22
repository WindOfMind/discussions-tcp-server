import { ResponseBuilder } from "../../src/message/response-builder";

describe("ResponseBuilder", () => {
    it("should build a simple response with end line", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with("part1")
            .with("part2")
            .build();
        expect(response).toBe("part1|part2\n");
    });

    it("should build a simple response without end line", () => {
        const response = new ResponseBuilder({ withEndLine: false })
            .with("part1")
            .with("part2")
            .build();
        expect(response).toBe("part1|part2");
    });

    it("should handle an empty response with end line", () => {
        const response = new ResponseBuilder({ withEndLine: true }).build();
        expect(response).toBe("\n");
    });

    it("should handle an empty response without end line", () => {
        const response = new ResponseBuilder({ withEndLine: false }).build();
        expect(response).toBe("");
    });

    it("should handle a list of parts with end line", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .withList(["a", "b", "c"])
            .build();
        expect(response).toBe("(a,b,c)\n");
    });

    it("should handle a list of parts without end line", () => {
        const response = new ResponseBuilder({ withEndLine: false })
            .withList(["a", "b", "c"])
            .build();
        expect(response).toBe("(a,b,c)");
    });

    it("should handle an empty list of parts with end line", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .withList([])
            .build();
        expect(response).toBe("\n");
    });

    it("should handle an empty list of parts without end line", () => {
        const response = new ResponseBuilder({ withEndLine: false })
            .withList([])
            .build();
        expect(response).toBe("");
    });

    it("should handle a mix of single parts and lists", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with("start")
            .withList(["a", "b"])
            .with("end")
            .build();
        expect(response).toBe("start|(a,b)|end\n");
    });

    it("should allow chaining withList and with", () => {
        const response = new ResponseBuilder({ withEndLine: false })
            .with("start")
            .withList(["a", "b"])
            .with("end")
            .build();
        expect(response).toBe("start|(a,b)|end");
    });

    it("should escape parts containing commas", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with("hello, world", true)
            .build();
        expect(response).toBe('"hello, world"\n');
    });

    it("should escape parts containing double quotes", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with('hello "world"', true)
            .build();
        expect(response).toBe('hello ""world""\n');
    });

    it("should escape parts containing both commas and double quotes", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with('hello, "world"', true)
            .build();
        expect(response).toBe('"hello, ""world"""\n');
    });

    it("should not escape parts when escape is false", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with('hello, "world"', false)
            .build();
        expect(response).toBe('hello, "world"\n');
    });

    it("should escape only if escape param is true", () => {
        const response = new ResponseBuilder({ withEndLine: true })
            .with("plain, text", false)
            .build();
        expect(response).toBe("plain, text\n");
    });
});
