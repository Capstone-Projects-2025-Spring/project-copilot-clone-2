import { LogData, LogEvent } from "../types/event";
import { Result } from "../types/result";
import { Suggestion, SuggestionResult } from "../types/suggestion";
import { hasBugRandomly } from "../utils/bug";
import { trackEvent } from "./log";
import { getSettings } from "../extension";

/* Endpoint for creating new AI suggestions */
const AI_ENDPOINT: string = "https://ai.nickrucinski.com/suggestion";

/* Endpoint for saving AI suggestions */
const LOG_SUGGESTION_ENDPOINT: string = "https://ai.nickrucinski.com/logs/suggestion";

/**
 * Fetches AI-generated suggestions based on the given prompt.
 *
 * @param {string} prompt - The input prompt to send to the AI model.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested strings.
 */
export async function fetchSuggestions(
    prompt: string,
): Promise<Result<SuggestionResult>> {
    const startTime = Date.now();
    const hasBug = hasBugRandomly();

    const settings = getSettings();

    const vendor = settings["vendor"] || "ollama";
    const model = settings["model"] || "codellama:7b";

    if (!vendor || !model) {
        console.error("Invalid vendor or model:", vendor, model);
        return {
            status: 500,
            success: false,
            error: "Invalid vendor or model"
        };
    }

    const parameters = {
        temperature: settings["temperature"],
        model: settings["model"],
        top_k: settings["top_k"],
        top_p: settings["top_p"],
        max_tokens: settings["max_tokens"]
    };

    const isCorrect = !hasBug;

    console.log(`Generating suggestion ${hasBug ? "WITH" : "WITHOUT"} bug...`);

    try {
        const response = await fetch(AI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    prompt,
                    vendor,
                    model,
                    isCorrect,
                    parameters
                }
            ),
        });

        if (!response.ok) {
            return {
                status: response.status,
                success: false,
                error: `Error: ${response.status} ${response.statusText}`
            };
        }

        const data = await response.json() as {
            data?: {
                suggestions: string[];
            };
            message?: string;
            status?: string;
            error?: string;
        };


        const endTime = Date.now(); 
        const elapsedTime = endTime - startTime;

        if (data.data?.suggestions && data.data.suggestions.length > 0) {
            const suggestionText = hasBug ?
                data.data.suggestions[1] :
                data.data.suggestions[0];

            const suggestion: Suggestion = {
                id: "",
                prompt,
                suggestionText: suggestionText,
                hasBug,
                model: model
            };

            const result = await saveSuggestionToDatabase(suggestion);
            const suggestionId = result.success && result.data ?
                result.data.id :
                "";

            const logData: LogData = {
                event: LogEvent.MODEL_GENERATE,
                metadata: {
                    time_lapse: elapsedTime,
                    suggestion_id: suggestionId,
                    has_bug: hasBug },
            };
    
            trackEvent(logData);

            return {
                status: response.status,
                success: true,
                data: {
                    suggestions: data.data.suggestions,
                    suggestionId, hasBug
                }
            };
        }

        return {
            status: response.status,
            success: false,
            error: data.error || "Unknown error"
        };

    } catch (error: any) {
        return {
            status: 500,
            success: false,
            error: error
        };
    }
}

/**
 * Save AI-generated suggestion.
 *
 * @param {Suggestion} suggestion - The suggestion text that was acted upon.
 */
async function saveSuggestionToDatabase(suggestion: Suggestion) : Promise<Result<Suggestion>> {
    const body = JSON.stringify(suggestion);

    try {
        const response = await fetch(LOG_SUGGESTION_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
        });

        if (!response.ok) {
            return {
                status: response.status,
                success: false,
                error: `Error: ${response.status} ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            status: response.status,
            success: true,
            data: data.data,
        };
    } catch (err) {
        console.error("Failed to save suggestion:", err);
        return {
            status: 500,
            success: false,
            error: "Failed to connect to server.",
        };
    }
}