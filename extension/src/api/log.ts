import { LogData, LogEvent } from "../types/event";
import { convertToSnakeCase } from "../utils";

/** Endpoint for logging information */
const LOG_ENDPOINT: string = "http://127.0.0.1:8001/logs";

/**
 * Logs the user's decision on an AI-generated suggestion.
 *
 * @param {LogData} logData - The data being logged.
 */
export function trackEvent(logData: LogData): void {
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
 * @returns {Promise<any>} - A promise that resolves to the logs for the user.
 */
export async function getLogsByUser(userId: string): Promise<any> {
    try {
        const response = await fetch(`${LOG_ENDPOINT}/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
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