import { getLogsByUser, trackEvent } from "../api/log";
import { globalContext } from "../extension";
import { LogData, LogEvent } from "../types/event";
import { AUTH_CONTEXT, AuthContext } from "../types/user";
import * as vscode from "vscode";

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
export const logSuggestionEvent = async (accepted: boolean, context: typeof suggestionContext) => {
    const { suggestionId, hasBug, startTime } = context;
    const elapsedTime = Date.now() - startTime;

    const userContext = globalContext.globalState.get(AUTH_CONTEXT) as AuthContext;

    const progress = await getLogsByUser(userContext.user?.id as string);
    console.log("Progress logs:", JSON.stringify(progress, null, 2));

    const { totalAccepted, totalWithBugs, percentageWithBugs } = calculateProgress(progress.data);

    // Display the progress to the user
    vscode.window.showInformationMessage(
        `You have accepted ${totalAccepted} suggestions. ` +
        `${percentageWithBugs.toFixed(2)}% of them had bugs.`
    );

    const logEventType = accepted ? LogEvent.USER_ACCEPT : LogEvent.USER_REJECT;
    const logData: LogData = {
        event: logEventType,
        timeLapse: elapsedTime,
        metadata: { user_id: userContext.user?.id, suggestion_id: suggestionId, has_bug: hasBug }
    };

    trackEvent(logData);
};

/**
 * Calculates progress statistics based on user logs.
 *
 * @param {any[]} logs - The logs for the user.
 * @returns {{
*   totalAccepted: number,
*   totalWithBugs: number,
*   percentageWithBugs: number
* }} - Progress statistics.
*/
function calculateProgress(logs: any[]): {
   totalAccepted: number;
   totalWithBugs: number;
   percentageWithBugs: number;
} {
   // Filter logs for USER_ACCEPT events
   const acceptedLogs = logs.filter((log) => log.event === "USER_ACCEPT");

   // Count total accepted suggestions and those with bugs
   const totalAccepted = acceptedLogs.length;
   const totalWithBugs = acceptedLogs.filter((log) => log.metadata.has_bug === true).length;

   // Calculate the percentage of accepted suggestions with bugs
   const percentageWithBugs = totalAccepted > 0 ? (totalWithBugs / totalAccepted) * 100 : 0;

   return {
       totalAccepted,
       totalWithBugs,
       percentageWithBugs,
   };
}