import * as vscode from "vscode";
import { Result } from "./types/result";
import { LogData, LogEvent } from "./types/event";

/** Endpoint for creating new AI suggestions */
const AI_ENDPOINT: string = "https://ai.nickrucinski.com/suggestion";

/** Endpoint for logging information */
const LOG_ENDPOINT: string = "https://ai.nickrucinski.com/logs";
// , endpoint = AI_ENDPOINT, model = "ollama", temperature = 0.2, topK = 0, topP = 1, maxTokens = 256
/**
 * Fetches AI-generated suggestions based on the given prompt.
 *
 * @param {string} prompt - The input prompt to send to the AI model.
 * @param {string} model - The LLM to be usded for generating suggestions.
 * @param {string} temperature - The temperature value to use for generating the response. Defaulted to 0.2.
 * @param {string} top_k - The Top K value to use for generating the response. Defaulted to 0.
 * @param {string} top_k - The Top P value to use for generating the response. Defaulted to 0.
 * @param {string} maxTokens - The max number of tokens allowed for response length.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested strings.
 */
export async function fetchSuggestions(prompt: string, model = "ollama", temperature = 0.2, top_k = 0, top_p = 1, maxTokens = 256): Promise<Result<string[]>> {
    const startTime = Date.now();
    
    try {
        const response = await fetch(AI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        const endTime = Date.now(); 
        const elapsedTime = endTime - startTime;

        if (!response.ok) {
            return { status: response.status, success: false, error: `Error: ${response.status} ${response.statusText}` };
        }

        const data = await response.json() as { suggestions?: string[]; error?: string };

        if (data.suggestions && data.suggestions) {
            const logData: LogData = {
                event: LogEvent.MODEL_GENERATE,
                time_lapse: elapsedTime,
                metadata: { prompt: prompt, suggestions: data.suggestions }
            };
    
            trackEvent(logData);

            return { status: response.status, success: true, data: data.suggestions };
        }

        return { status: response.status, success: false, error: data.error || "Unknown error" };
    } catch (error: any) {
        return { status: 500, success: false, error: error.message || "Unknown error" };
    }
}

/**
 * Logs the user's decision on an AI-generated suggestion.
 *
 * @param {LogData} logData - The suggestion text that was acted upon.
 */
export function trackEvent(logData: LogData): void {
    const body = JSON.stringify(logData);

    console.log("Logging event...", body);

    fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
    }).catch(err => console.error("Failed to log data:", err));
    console.log("Elapsed time:", logData.time_lapse);
}