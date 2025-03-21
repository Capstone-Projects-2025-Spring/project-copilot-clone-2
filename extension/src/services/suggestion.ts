import * as vscode from 'vscode';
import { fetchSuggestions } from '../api/suggestion';
import { createCodeComparisonWebview } from '../utils/views';
import { logSuggestionEvent } from './log';

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

/** Timeout handler for debouncing text changes */
let debounceTimer: NodeJS.Timeout | null = null;
const TYPING_PAUSE_THRESHOLD = 2000;
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
    token: vscode.CancellationToken
): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[]> {
    return new Promise((resolve) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer); // Clear the previous timer
        }

        // Store the latest request
        lastRequest = { document, position, context, token };

        // Set a new timer
        debounceTimer = setTimeout(async () => {
            if (lastRequest) {
                const { document, position, context, token } = lastRequest;
                const prompt = getPromptText(document, position);

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
                    resolve([]); // Resolve with an empty array if no suggestions are available
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
    'clover.acceptInlineSuggestion',
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');

        if (suggestionContext.hasBug) {
            vscode.window.showWarningMessage(
                'Warning: The accepted suggestion may contain a bug. Please review the code carefully.',
                { modal: true },
                'Review Code',
                'Ignore'
            ).then(async (selection) => {
                if (selection === 'Review Code') {
                    // Get the original code (before the suggestion)
                    const rigthCode = suggestionContext.suggestions[0];

                    // Get the suggested code (from the suggestion context)
                    const wrongCode = suggestionContext.suggestions[1];

                    // Create a Webview to display the code comparison
                    createCodeComparisonWebview(rigthCode, wrongCode);

                    resetSuggestionContext();
                }
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
    'clover.rejectInlineSuggestion', 
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
};