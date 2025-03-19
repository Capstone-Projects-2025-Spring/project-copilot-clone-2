import { LogData, LogEvent } from "./types/event";
import { trackEvent } from "./api/log";

interface IncorrectUserChoice {
    suggestion: string;
    suggestionStartTime: number;
}

/** Initialize a new map to store incorrect suggestions that the user selects */
const incorrectUserChoices: Map<string, IncorrectUserChoice[]> = new Map();

/** 
* @param {string} userId - Unique user identifier
* @param {string} incorrectSuggestion - Suggestion that the user marks as incorrect 
*/

export function trackIncorrectChoices(userId: string, incorrectSuggestion: string): void {
    /** Make sure that the user ID is real. */
    if(!userId) {
        console.warn("No User ID Detected.")
        return;
    }
    /** Adds an array of incorrect user choices for a user and their ID if they are not in the map yet. */
    if(!incorrectUserChoices.has(userId)){
        incorrectUserChoices.set(userId, []);
    }
    /** Gets the user's incorrect choices and adds new incorrect choice to the user's array. */
    incorrectUserChoices.get(userId)!.push({
        suggestion: incorrectSuggestion,
        suggestionStartTime: Date.now(),
    });
    /** Create log for when the user does not accept a code suggestion from the model. */
    const logData: LogData = {
        event: LogEvent.USER_REJECT,
        timeLapse: 0,
        metadata: { userId, incorrectSuggestion, incorrectAttempt: incorrectUserChoices.get(userId)?.length || 1 },
    };
    trackEvent(logData);
}

/**
 * 
 * @param {string} userId - Unique User ID
 * @returns {IncorrectUserChoice[]} - All of the user's incorrect choices stored in an array.
 */

/** Retrieve the incorrect choices by userId */
export function getIncorrectChoices(userId: string): IncorrectUserChoice[] {
    return incorrectUserChoices.get(userId) || [];
}