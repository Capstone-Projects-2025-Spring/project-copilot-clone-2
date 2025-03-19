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
