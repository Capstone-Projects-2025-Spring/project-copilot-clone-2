import { LogData, LogEvent } from "../types/event";
import { Result } from "../types/result";
import { Suggestion, SuggestionResult } from "../types/suggetsion";
import { hasBugRandomly } from "../utils/bug";
import { trackEvent } from "./log";

/* Endpoint for creating new AI suggestions */
const AI_ENDPOINT: string = "http://127.0.0.1:8001/suggestion";

/* Endpoint for saving AI suggestions */
const LOG_SUGGESTION_ENDPOINT: string = "http://127.0.0.1:8001/logs/suggestion";

/**
 * Fetches AI-generated suggestions based on the given prompt.
 *
 * @param {string} prompt - The input prompt to send to the AI model.
 * @param {string} model - The LLM to be usded for generating suggestions.
 * @param {string} temperature - The temperature value to use for generating the response. Defaulted to 0.2.
 * @param {string} top_k - The Top K value to use for generating the response. Defaulted to 0.
 * @param {string} top_p - The Top P value to use for generating the response. Defaulted to 0.
 * @param {string} max_tokens - The max number of tokens allowed for response length.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested strings.
 */
export async function fetchSuggestions(
    prompt: string, 
    model: string = "gemini", 
    temperature: number = 0.2, 
    top_k: number = 0, 
    top_p: number = 1, 
    max_tokens: number = 256, 
    endpoint = AI_ENDPOINT
): Promise<Result<SuggestionResult>> {
    const startTime = Date.now();
    const hasBug = hasBugRandomly();
    let elapsedTime = null;

    console.log(`Generating suggestion ${hasBug ? "WITH" : "WITHOUT"} bug...`);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt, model, temperature, top_k, top_p, max_tokens }),
        });

        const endTime = Date.now(); 
        elapsedTime = endTime - startTime;

        if (!response.ok) {
            return { status: response.status, success: false, error: `Error: ${response.status} ${response.statusText}` };
        }

        const data = await response.json() as { data: { suggestions?: string[][] }; error?: string };

        if (data.data?.suggestions?.length) {
            const suggestionsArray = data.data.suggestions[0];
            const suggestion: Suggestion = {
                id: "",
                prompt,
                suggestionText: hasBug ? suggestionsArray[1] : suggestionsArray[0],
                hasBug,
                model: model
            };

            const result = await saveSuggestionToDatabase(suggestion);
            const suggestionId = result.success ? result.data : "";

            const logData: LogData = {
                event: LogEvent.MODEL_GENERATE,
                timeLapse: elapsedTime,
                metadata: { suggestion_id: suggestionId, has_bug: hasBug },
            };
    
            trackEvent(logData);

            return { status: response.status, success: true, data: { suggestions: suggestionsArray, suggestionId, hasBug } };
        }

        return { status: response.status, success: false, error: data.error || "Unknown error" };
    } catch (error: any) {
        return { status: 500, success: false, error: error.message || "Unknown error" };
    }
}

/**
 * Save AI-generated suggestion.
 *
 * @param {Suggestion} suggestion - The suggestion text that was acted upon.
 */
async function saveSuggestionToDatabase(suggestion: Suggestion) : Promise<Result<string>> {
    const body = JSON.stringify(suggestion);

    try {
        const response = await fetch(LOG_SUGGESTION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: body,
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return {
            status: response.status,
            success: true,
            data: result.data as string,
        };
    } catch (error: any) {
        console.error("Error saving suggestion: ", error);
        return {
            status: 500,
            success: false,
            error: error.message,
        };
    }
}