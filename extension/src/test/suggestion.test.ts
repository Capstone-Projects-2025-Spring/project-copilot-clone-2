import { fetchSuggestions } from "../api";

describe("fetchSuggestions", () => {
    it("should return success with status 200", async () => {
        const prompt = "hello";
        const result = await fetchSuggestions(prompt);

        expect(result.status).toBe(200);
    });

    it("should return success with an array of suggestions", async () => {
        const prompt = "function add(a, b)";
        const result = await fetchSuggestions(prompt);

        if (result.success) {
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        }
    });

    it("should return error with status 400 when request is bad", async () => {
        const result = await fetchSuggestions("");

        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        if (!result.success) {
            expect(result.error).toBeDefined();
        }
    });
});
