import * as vscode from "vscode";

/** Endpoint for creating new AI suggestions */
const AI_ENDPOINT: string = "https://ai.nickrucinski.com/generate";

/** Endpoint for logging information */
const LOG_ENDPOINT: string = "http://ai.nickrucinski.com/log";

/**
 * Fetches AI-generated suggestions based on the given prompt.
 *
 * @param {string} prompt - The input prompt to send to the AI model.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested strings.
 */
export async function fetchSuggestions(prompt: string): Promise<string[]> {
    try {
        const response = await fetch(AI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error("HTTP ERROR: " + response.statusText);
        }

        const data = await response.json() as { suggestions: string[] };
        if (data.suggestions && data.suggestions.length > 0) {
            return data.suggestions;
        }
    } catch (error) {
        console.error("Error fetching AI suggestion", error);
    }
    return [];
}

/**
 * Logs the user's decision on an AI-generated suggestion.
 *
 * @param {string} text - The suggestion text that was acted upon.
 * @param {number} elapsedTime - The time elapsed (in milliseconds) since the suggestion was generated.
 */
export function logSuggestionDecision(text: string, elapsedTime: number) {
    fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event: "suggestion_decision",
            data: elapsedTime,
            text: text,
        }),
    }).catch(err => console.error("Failed to log data:", err));
    console.log("Elapsed time:", elapsedTime);
}