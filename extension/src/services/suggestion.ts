import * as vscode from 'vscode';
import { fetchSuggestions } from '../api/suggestion';
import { createCodeComparisonWebview } from '../utils/views';
import { logSuggestionEvent } from './log';
import { AUTH_CONTEXT, AuthContext } from '../types/user';
import { signIn } from './auth';
import { globalContext } from '../extension';
import { getSupabaseClient } from '../configs/supabaseClient';

/** 
 * Tracks contextual information for a suggestion, including its unique ID, 
 * whether it contains a bug, and the start time of the suggestion process. 
 */
let suggestionContext = {
    suggestions: [] as string[],
    suggestionId: "",
    hasBug: false,
    startTime: 0
};

/** 
 * Stores suggestions that need to be reviewed by the user. 
 * This is used when a suggestion is accepted but contains a bug.
 */
let suggestionsToReview: string[] = [];

/** Timeout handler for debouncing text changes */
let debounceTimer: NodeJS.Timeout | null = null;
const TYPING_PAUSE_THRESHOLD = 1000;
let lastRequest: { document: vscode.TextDocument; position: vscode.Position; context: vscode.InlineCompletionContext; token: vscode.CancellationToken } | null = null;

/**
 * Provides inline completion items based on AI-generated suggestions.
 *
 * @param {vscode.TextDocument} document - The active text document.
 * @param {vscode.Position} position - The current cursor position.
 * @param {vscode.InlineCompletionContext} context - The inline completion context.
 * @param {vscode.CancellationToken} token - A cancellation token.
 * @returns {Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[]>} 
 * A list of inline completion items.
 */
export async function provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[]> {
    return new Promise((resolve) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer); // Clear the previous timer
        }

        // Store the latest request
        lastRequest = { document, position, context, token };

        // Set a new timer
        debounceTimer = setTimeout(async () => {
            console.log("Debounce timer triggered for inline suggestion...", suggestionsToReview.length);
            if (suggestionsToReview.length > 0) {
                return;
            } 

            const userContext = globalContext.globalState.get(AUTH_CONTEXT) as AuthContext;

            if (!userContext || !userContext.isAuthenticated) {
                await vscode.window.showInformationMessage(
                    "You are not authenticated. Please sign in to track your progress!",
                    "Sign In"
                ).then((selection) => { 
                    if (selection === "Sign In") {
                        signIn(globalContext);
                    }
                });
            }

            const isLocked = await isUserUnlocked(userContext.user?.id as string);

            if (isLocked) {
                vscode.window.showInformationMessage(
                    "Your suggestions are locked. Please review your progress to unlock it.",
                    "Review",
                    "Ignore"
                ).then((selection) => {
                    if (selection === "Review") {
                        vscode.env.openExternal(vscode.Uri.parse("https://clover.nickrucinski.com/"));
                    }
                });

                return;
            }

            if (lastRequest) {
                const { document, position, context, token } = lastRequest;
                const prompt = getPromptText(document, position);

                if (!prompt || prompt.trim() === "") {
                    return;
                }

                const result = await fetchSuggestions(prompt);

                if (result.success && result.data) {
                    const { suggestions, suggestionId, hasBug } = result.data;

                    suggestionContext = { 
                        suggestions,
                        suggestionId, 
                        hasBug,
                        startTime: Date.now()
                    };

                    const responseSuggestions = hasBug ? [suggestions[1]] : [suggestions[0]];
                    // Create InlineCompletionItems
                    const completionItems = responseSuggestions.map(suggestion => new vscode.InlineCompletionItem(suggestion));

                    resolve(completionItems);
                } else {
                    return; 
                }
            }
        }, TYPING_PAUSE_THRESHOLD); // Debounce delay of 300ms
    });
}

/**
 * Extracts the text from the beginning of the current line to the cursor position.
 * This is used to generate a prompt for inline suggestions.
 *
 * @param {vscode.TextDocument} document - The active text document.
 * @param {vscode.Position} position - The current cursor position.
 * @returns {string} The text from the start of the line to the cursor position.
 */
const getPromptText = (document: vscode.TextDocument, position: vscode.Position): string => {
    return document.getText(new vscode.Range(position.with(undefined, 0), position));
};

/**
 * Registers a command to accept the current inline suggestion.
 * Commits the inline suggestion and logs the acceptance event.
 */
export const acceptSuggestion = vscode.commands.registerCommand(
    'copilotClone.acceptInlineSuggestion',
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');

        if (suggestionContext.hasBug) {
            suggestionsToReview = suggestionContext.suggestions;
            vscode.window.showWarningMessage(
                'Warning: The accepted suggestion may contain a bug. Please review the code carefully.',
                { modal: false },
                'Review Code',
                'Ignore'
            ).then(async (selection) => {
                if (selection === 'Review Code') {
                    // Get the original code (before the suggestion)
                    const rigthCode = suggestionsToReview[0];

                    // Get the suggested code (from the suggestion context)
                    const wrongCode = suggestionsToReview[1];

                    // Create a Webview to display the code comparison
                    createCodeComparisonWebview(rigthCode, wrongCode);
                }

                resetSuggestionContext();
            });
        }

        logSuggestionEvent(true, suggestionContext);
    }
);

/**
 * Registers a command to reject the current inline suggestion.
 * Hides the inline suggestion and logs the rejection event.
 */
export const rejectSuggestion = vscode.commands.registerCommand(
    'copilotClone.rejectInlineSuggestion', 
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        await vscode.commands.executeCommand('hideSuggestWidget');

        logSuggestionEvent(false, suggestionContext);
        resetSuggestionContext();
    }
);

/**
 * Resets the suggestion context to its initial state.
 */
const resetSuggestionContext = () => {
    suggestionContext = {
        suggestions: [],
        suggestionId: "",
        hasBug: false,
        startTime: 0
    };
    suggestionsToReview = [];
};

const isUserUnlocked = async (userId: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client initialization failed.');
    }

    const { data, error } = await supabase
        .from("users")
        .select("is_locked")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Failed to check user lock status:", error);
        return false;
    }

    return data.is_locked;
};
