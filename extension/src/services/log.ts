import { trackEvent } from "../api/log";
import { LogData, LogEvent } from "../types/event";

let suggestionContext = {
    suggestionId: "",
    hasBug: false,
    startTime: 0
};

/**
 * Logs an event when a suggestion is either accepted or rejected.
 * Tracks the elapsed time, suggestion ID, and whether the suggestion was accepted.
 * Resets the suggestion context after logging.
 *
 * @param {boolean} accepted - Whether the suggestion was accepted (true) or rejected (false).
 * @param {typeof suggestionContext} context - The entire suggestion context object.
 */
export const logSuggestionEvent = (accepted: boolean, context: typeof suggestionContext) => {
    const { suggestionId, hasBug, startTime } = context;
    const elapsedTime = Date.now() - startTime;

    const logEventType = accepted ? LogEvent.USER_ACCEPT : LogEvent.USER_REJECT;
    const logData: LogData = {
        event: logEventType,
        timeLapse: elapsedTime,
        metadata: { user_id: "12345", suggestion_id: suggestionId, has_bug: hasBug }
    };

    trackEvent(logData);
};