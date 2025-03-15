import * as vscode from 'vscode';
import { checkAndStoreSupabaseSecrets, getSupabaseClient } from './supabaseClient';
import { LogData, LogEvent } from './types/event';
import { trackEvent } from './api/log';
import { fetchSuggestions } from './api/suggestion';

/** Stores the last used prompt to prevent redundant requests */
// let lastPrompt = "";

/** Maps a unique suggestion ID to its timestamp for tracking elapsed time */
const suggestionStartTime = new Map<string, number>();
let suggestionContext = {
    id: "",
    hasBug: false
};

/** Timeout handler for debouncing text changes */
let debounceTimer: NodeJS.Timeout | null = null;
const TYPING_PAUSE_THRESHOLD = 2000;
let lastRequest: { document: vscode.TextDocument; position: vscode.Position; context: vscode.InlineCompletionContext; token: vscode.CancellationToken } | null = null;

/**
 * Activates the VS Code extension.
 *
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
    // Load environment variables from .env file
    const secretStorage = context.secrets;
    checkAndStoreSupabaseSecrets(secretStorage);

    console.log("AI Extension Activated");

    context.subscriptions.push(
        acceptSuggestion,
        rejectSuggestion,
        // Sign in with email command 
        vscode.commands.registerCommand('copilotClone.signIn', () => signIn(context)),
        testFetchCommand,
        // Inline completion provider
        vscode.languages.registerInlineCompletionItemProvider(
            { scheme: 'file' },
            {
                provideInlineCompletionItems
            }
        ),
    );
}

const acceptSuggestion = vscode.commands.registerCommand(
    'copilotClone.acceptInlineSuggestion',
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');

        logSuggestionEvent(true);
        console.log("TESTING: Accepted Suggestion");
    }
);

const rejectSuggestion = vscode.commands.registerCommand(
    'copilotClone.rejectInlineSuggestion', 
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        await vscode.commands.executeCommand('hideSuggestWidget');

        logSuggestionEvent(false);
        console.log("TESTING: Rejected Suggestion");
    }
);

// Debug command to force a fetch using input from the user.
const testFetchCommand = vscode.commands.registerCommand('copilotClone.testFetch', async () => {
    const userInput = await vscode.window.showInputBox({
        prompt: 'Enter prompt for suggestion.',
    });
    console.log("Test Fetch: \"" + userInput + "\"");

    if (userInput) {
        try {
            const settings = getSettings();
            const result = await fetchSuggestions(userInput, settings["model"], settings["temperature"], settings["top_k"], 
                    settings["top_p"], settings["max_tokens"]);
                    
            if (result.success) {
                vscode.window.showInformationMessage(`Suggestions: ${result.data.suggestions.join(", ")}`);
            } else {
                vscode.window.showErrorMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching suggestions: Unknown Error`);
        }
    }
});

function logSuggestionEvent(accepted: boolean) {
    const suggestionId = suggestionContext.id;
    const startTime = suggestionStartTime.get(suggestionId) || 0;
    const elapsedTime = Date.now() - startTime;

    // if (!lastSuggestion || lastSuggestion.trim() === "") {
    //     console.log("No active suggestion, ignoring.");
    //     return;
    // }

    const logEventType = accepted ? LogEvent.USER_ACCEPT : LogEvent.USER_REJECT;
    const logData: LogData = {
        event: logEventType,
        time_lapse: elapsedTime,
        metadata: { userId: "12345", suggestionId, hasBug: false }
    };

    trackEvent(logData);
    suggestionStartTime.delete(suggestionId);
}

/**
 * Handles user sign-in, allowing them to select between email or GitHub authentication.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
async function signIn(context: vscode.ExtensionContext){
    const signInMethod = await vscode.window.showQuickPick(['Sign in with Email', 'Sign in with GitHub'], { placeHolder: 'Choose a sign-in method' });

    if (signInMethod === 'Sign in with Email') {
        signInOrSignUpEmail(context);
    } else if (signInMethod === 'Sign in with GitHub') {
        signInWithGithub(context);
    }
}

/**
 * Signs in or signs up a user using an email and password.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
//want to make it to sign up but need to look at database, this works for now 
async function signInOrSignUpEmail(context: vscode.ExtensionContext) {
    const supabase = await getSupabaseClient(context);
    if (!supabase) {
        vscode.window.showErrorMessage('Supabase client initialization failed.');
        return;
    }

    // Ask user to choose sign in or sign up
    const action = await vscode.window.showQuickPick(["Sign In", "Sign Up"], { 
        placeHolder: "Do you want to sign in or sign up?" 
    });

    if (!action) return;

    const email = await vscode.window.showInputBox({ prompt: 'Enter your email', placeHolder: "sample@gmail.com" });
    if (!email) return;

    const password = await vscode.window.showInputBox({ prompt: 'Enter your password', placeHolder: "password", password: true });
    if (!password) return;

    let response;
    let logEventType = action === "Sign In" ? LogEvent.USER_LOGIN : LogEvent.USER_SIGNUP;

    if (action === "Sign In") {
        response = await supabase.auth.signInWithPassword({ email, password });
    } else {
        response = await supabase.auth.signUp({ email, password });
    }

    const { data, error } = response;

    if (error) {
        vscode.window.showErrorMessage(`${action} failed: ${error.message}`);
    } else {
        vscode.window.showInformationMessage(`${action} successful! 🎉`);

        const logData: LogData = {
            event: logEventType,
            time_lapse: 0,
            metadata: { userId: data.user?.id, email: data.user?.email }
        };

        trackEvent(logData);
    }
}

// needs OAuth URL to sign in with GitHub and log the event
/**
 * Signs in a user using GitHub OAuth authentication.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
async function signInWithGithub(context: vscode.ExtensionContext){  
    const supabase = await getSupabaseClient(context);
    try {
        // Redirect to GitHub for authentication
            vscode.window.showInformationMessage("Redirecting to GitHub for authentication...");
            if (!supabase) {
                vscode.window.showErrorMessage('Supabase client initialization failed.');
                return;
            }
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
        });

        if (error) {
            vscode.window.showErrorMessage(`GitHub sign-in failed: ${error.message}`);
        } 
        if (data?.url) {
            await vscode.env.openExternal(vscode.Uri.parse(data.url));
        }
        
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session) {
            const user = sessionData.session.user;
            const logData: LogData = {
                event: LogEvent.USER_AUTH_GITHUB,
                time_lapse: 0,
                metadata: { userId: user.id, email: user.email }
            };
    
            trackEvent(logData);

            vscode.window.showInformationMessage(`GitHub sign-in successful! 🎉`);
        }
            
        vscode.window.showErrorMessage(`Failed to get OAuth URL.`);
    }
    catch (error: any) {
        vscode.window.showErrorMessage(`Unexpected Error: ${error.message}`);
    }
}

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
async function provideInlineCompletionItems(
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

                if (!shouldFetchSuggestion(prompt)) {
                    resolve([]); // Resolve with an empty array if no suggestion should be fetched
                    return;
                }

                // lastPrompt = prompt;

                console.log("Fetching suggestion for prompt:", prompt);

                const settings = getSettings();
                const result = await fetchSuggestions(prompt, settings["model"], settings["temperature"], settings["top_k"], settings["top_p"], settings["max_tokens"]);

                if (result.success && result.data) {
                    const { suggestions, suggestionId, hasBug } = result.data;
                    suggestionContext = { 
                        id: suggestionId, 
                        hasBug
                    };

                    // Create InlineCompletionItems
                    const completionItems = suggestions.map(suggestion => new vscode.InlineCompletionItem(suggestion));

                    // Set suggestionStartTime when the suggestion is returned

                    suggestionStartTime.set(suggestionId, Date.now());

                    resolve(completionItems);
                } else {
                    resolve([]); // Resolve with an empty array if no suggestions are available
                }
            }
        }, TYPING_PAUSE_THRESHOLD); // Debounce delay of 300ms
    });
}

/**
 * Extracts the text from the beginning of the line to the current cursor position.
 *
 * @param {vscode.TextDocument} document - The active text document.
 * @param {vscode.Position} position - The current cursor position.
 * @returns {string} The extracted prompt text.
 */
function getPromptText(document: vscode.TextDocument, position: vscode.Position): string {
    return document.getText(new vscode.Range(position.with(undefined, 0), position));
}

/**
 * Determines whether a suggestion should be fetched based on the prompt.
 *
 * @param {string} prompt - The current prompt text.
 * @returns {boolean} True if a suggestion should be fetched, otherwise false.
 */
function shouldFetchSuggestion(prompt: string): boolean {
    if (!/\s$/.test(prompt)) { return false; } // Fetch only after a space or punctuation
    //if (prompt === lastPrompt) { return false; } // Avoid redundant requests
    return true;
}

/**
 * Gets the settings for the AI model from the VS Code workspace configuration.
 * 
 * @returns {Object} The settings for the AI model, including model selection, temperature, top_k, top_p, and max_tokens.
 */
function getSettings() {
    const model = vscode.workspace.getConfiguration("copilot-clone").get<string>("general.modelSelection");
    const temperature = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.temperature");
    const top_k = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.top_k");
    const top_p = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.top_p");
    const max_tokens = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.maxTokens");

    return { model, temperature, top_k, top_p, max_tokens };
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
    console.log("AI Extension Deactivated");
}
