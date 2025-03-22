import * as vscode from "vscode";
import { trackEvent } from "../api/log";
import { getSupabaseClient } from "../configs/supabaseClient";
import { LogData, LogEvent } from "../types/event";

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
export function calculateUserProgress(logs: any[]): {
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

/**
 * Generates a new batch ID based on the current timestamp.
 * 
 * @returns {string} - A new batch ID based on the current timestamp.
 */
function generateNewBatchId(): string {
    return `${Date.now()}`;
}

/**
 * Retrieves the current code context ID for the user from the Supabase database.
 * If it doesn't exist, generates a new one and stores it.
 * 
 * @param {string} userId - The ID of the user whose code context is to be retrieved. 
 * @returns {Promise<string>} - A promise that resolves to the current or newly generated code context ID.
 */
export const getUserCodeContext = async (userId: string): Promise<string> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client initialization failed.");
    }

    // Fetch the current batch ID for the user
    const { data, error } = await supabase
        .from("users")
        .select("code_context_id")
        .eq("id", userId)
        .single();

    if (error || !data?.code_context_id) {
        // If no batchId exists, generate a new one and store it
        const newBatchId = generateNewBatchId();
        await updateUserCodeContext(userId, newBatchId);
        return newBatchId;
    }

    return data.code_context_id;
};


/**
 * Updates the user's code context ID in the Supabase database.
 * 
 * @param {string} userId - The ID of the user whose code context is to be updated. 
 * @param {string} codeContextId - The new code context ID to be set for the user. 
 */
export const updateUserCodeContext = async (userId: string, codeContextId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client initialization failed.");
    }

    const { error } = await supabase
        .from("users")
        .update({ code_context_id: codeContextId })
        .eq("id", userId);

    if (error) {
        console.error("Failed to update batch ID in database:", error);
        throw new Error("Failed to update code context.");
    }
};

/**
  * Updates the user's isLocked status in the Supabase database.
  * 
  * @param {string} userId - The ID of the user to be locked.
  * @param {string} codeContextId - The current code context ID for the user.
  */
export const lockUserInDatabase = async (userId: string, codeContextId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client initialization failed.');
    }
        
    const { error } = await supabase
        .from("users")
        .update({ is_locked: true })
        .eq("id", userId);

    if (error) {
        console.log("Failed to lock user:", error);
    } else {
        notifyUser(
            "Too many accepted suggestions contain bugs. Please review your progress to keep getting suggestions.", 
            "https://clover.nickrucinski.com/",
            true
        );

        const logData: LogData = {
            event: LogEvent.USER_LOCKED,
            timeLapse: 0,
            metadata: { 
                user_id: userId, 
                code_context_id: codeContextId
            }
        };
    
        trackEvent(logData); 
    }
};

/**
  * Notifies the user with a message and optional redirection.
  * 
  * @param {string} message - The message to display to the user.
  * @param {string} [url] - Optional URL to redirect the user to when they click "Open".
  * @param {boolean} [isModal=true] - Whether to display the notification as a modal dialog.
  */
export function notifyUser(message: string, url?: string, isModal: boolean = false) {
    vscode.window
        .showInformationMessage(message, { modal: isModal }, "Review", "Ignore")
        .then((selection) => {
            if (selection === "Review") {
                vscode.env.openExternal(vscode.Uri.parse(url || "https://clover.nickrucinski.com/"));
            }
        });
}