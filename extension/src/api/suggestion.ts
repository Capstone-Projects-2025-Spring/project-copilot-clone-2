import { LogData, LogEvent } from "../types/event";
import { Result } from "../types/result";
import { Suggestion, SuggestionResult } from "../types/suggestion";
import { hasBugRandomly } from "../utils/bug";
import { trackEvent } from "./log";
import { getSettings } from "../extension";

const TESTING: boolean = true;

/* Endpoint for creating new AI suggestions */
const AI_ENDPOINT: string = TESTING ?
    "http://127.0.0.1:8001/suggestion" :
    "https://ai.nickrucinski.com/suggestion";

/* Endpoint for saving AI suggestions */
const LOCAL_LOG_SUGGESTION_ENDPOINT: string = "http://127.0.0.1:8001/logs/suggestion";

const LOG_SUGGESTION_ENDPOINT: string = TESTING ?
    "http://127.0.0.1:8001/logs/suggestion" :
    "https://ai.nickrucinski.com/logs/suggestion";

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
    let elapsedTime = null;

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
                    vendor: "google",
                    model,
                    isCorrect,
                    parameters
                }
            ),
        });

        const endTime = Date.now(); 
        elapsedTime = endTime - startTime;

        if (!response.ok) {
            return {
                status: response.status,
                success: false,
                error: `Error: ${response.status} ${response.statusText}`
            };
        }

        const data = await response.json() as { data: { suggestions?: string[][] }; error?: string };

        if (data.data?.suggestions?.length) {
            const suggestionsArray = data.data.suggestions[0];
            const suggestion: Suggestion = {
                id: "",
                prompt,
                suggestionText: hasBug ? suggestionsArray[1] : suggestionsArray[0],
                hasBug,
                model: model,
                vendor: vendor
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
async function saveSuggestionToDatabase(suggestion: Suggestion) : Promise<Result<string>> {
    const body = JSON.stringify(suggestion);

    try {
        const response = await fetch(LOCAL_LOG_SUGGESTION_ENDPOINT, {
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