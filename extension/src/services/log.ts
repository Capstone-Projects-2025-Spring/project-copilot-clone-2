import { getLogsByUser, trackEvent } from "../api/log"
import { globalContext } from "../extension";
import { LogData, LogEvent } from "../types/event";
import { AUTH_CONTEXT, AuthContext } from "../types/user";
import { calculateUserProgress, getUserCodeContext, lockUserInDatabase, notifyUser, updateUserCodeContext } from "./user";

/**
 * This module provides functionality to log user interactions with AI-generated suggestions.
 * It tracks whether a suggestion was accepted or rejected, calculates user progress,
 * and updates the user's status in the database if necessary.
 */
let suggestionContext = {
    suggestionId: "",
    hasBug: false,
    startTime: 0
};

/**
 * Thresholds for user progress tracking.
 */
let ACCEPTED_THRESHOLD = 20;

/**
 * Percentage of accepted suggestions with bugs that triggers a user lock.
 * If the percentage exceeds this value, the user will be locked in the database.
 */
let BUG_ACCEPTED_PERCENTAGE = 30;

/**
 * Logs an event when a suggestion is either accepted or rejected.
 * Tracks the elapsed time, suggestion ID, and whether the suggestion was accepted.
 * Resets the suggestion context after logging.
 *
 * @param {boolean} accepted - Whether the suggestion was accepted (true) or rejected (false).
 * @param {typeof suggestionContext} context - The entire suggestion context object.
 */
export const logSuggestionEvent = async (accepted: boolean, context: typeof suggestionContext) => {
    const { suggestionId, hasBug, startTime } = context;
    const elapsedTime = Date.now() - startTime;

    const userContext = globalContext.globalState.get(AUTH_CONTEXT) as AuthContext;
    const userId = userContext.user?.id as string;

    const codeContextId = await getUserCodeContext(userId);

    const logEventType = accepted ? LogEvent.USER_ACCEPT : LogEvent.USER_REJECT;
    const logData: LogData = {
        event: logEventType,
        timeLapse: elapsedTime,
        metadata: { 
            user_id: userId, 
            suggestion_id: suggestionId, 
            has_bug: hasBug,
            code_context_id: codeContextId, 
        }
    };

    trackEvent(logData);

    const userLog = await getLogsByUser(userContext.user?.id as string);
    const { totalAccepted, totalWithBugs, percentageWithBugs } = calculateUserProgress(userLog.data);
 
    if (totalAccepted >= ACCEPTED_THRESHOLD) {
        if (percentageWithBugs > BUG_ACCEPTED_PERCENTAGE) {
            lockUserInDatabase(userId, codeContextId);
        } else {
            notifyUser("Congrats! You've earned a badge!", "https://clover.nickrucinski.com/");
            BUG_ACCEPTED_PERCENTAGE = 25;
        }

        // Reset progress: Generate new batch ID and store it
        await updateUserCodeContext(userId, codeContextId);
    }
};
