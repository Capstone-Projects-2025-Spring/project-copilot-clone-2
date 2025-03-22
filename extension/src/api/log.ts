import { LogData } from "../types/event";
import { convertToSnakeCase } from "../utils";

/** Endpoint for logging information */
const LOG_ENDPOINT: string = "https://api.nickrucinski.com/logs";

/**
 * Logs the user's decision on an AI-generated suggestion.
 *
 * @param {LogData} logData - The data being logged.
 */
export function trackEvent(logData: LogData) {
    const logDataForBackend = convertToSnakeCase(logData);

    console.log("Logging data for event:", logDataForBackend.event);

    fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logDataForBackend),
    }).catch(err => console.error("Failed to log data:", err));
}

/**
 * Fetches logs for a specific user from the backend.
 *
 * @param {string} userId - The ID of the user whose logs are to be fetched.
 * @param {string} [codeContextId] - Optional code context ID to filter logs.
 * @returns {Promise<any>} - A promise that resolves to the logs for the user.
 */
export async function getLogsByUser(userId: string, codeContextId?: string): Promise<any> {
    try {
        const url = new URL(`${LOG_ENDPOINT}/${userId}`);

        // Append code_context_id as a query parameter if provided
        if (codeContextId) {
            url.searchParams.append("code_context_id", codeContextId);
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch logs: ${response.statusText}`);
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error; 
    }
}