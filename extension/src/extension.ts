import * as vscode from 'vscode';
import { fetchSuggestions, trackEvent } from './api';
import { checkAndStoreSupabaseSecrets, getSupabaseClient } from './supabaseClient';
import * as dotenv from 'dotenv';
import { LogData, LogEvent } from './types/event';

/** Stores the last used prompt to prevent redundant requests */
let lastPrompt = "";

/** Maps a unique suggestion ID to its timestamp for tracking elapsed time */
let suggestionStartTime = new Map<string, number>();
let lastSuggestion = "";

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

    // Debug command to force a fetch using input from the user.
    let disposable = vscode.commands.registerCommand('copilotClone.testFetch', async () => {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter prompt for suggestion.',
        });
        console.log("Test Fetch: \"" + userInput + "\"");

        if (userInput) {
            try {
                const endpoint = vscode.workspace.getConfiguration("copilot-clone").get<string>("debug.AIEndpoint");
                const model = vscode.workspace.getConfiguration("copilot-clone").get<string>("general.modelSelection");
                const temperature = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.temperature");
                const top_k = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.topK");
                const top_p = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.topP");
                const max_tokens = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.maxTokens");
                const result = await fetchSuggestions(userInput, model, temperature, top_k, top_p, max_tokens);
                if (result.success) {
                    vscode.window.showInformationMessage(`Suggestions: ${result.data.join(", ")}`);
                } else {
                    vscode.window.showErrorMessage(`Error: ${result.error}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error fetching suggestions: Unknown Error`);
            }
        }
    });

    // Sign in with email command 
    context.subscriptions.push(
        vscode.commands.registerCommand('copilotClone.signIn', () => signIn(context))
    );
    
    // Inline completion provider
    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            { scheme: 'file' },
            {
                provideInlineCompletionItems
            }
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(handleTextChange)
    );
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
    // Debounce the function
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

                lastPrompt = prompt;

                const result = await fetchSuggestions(prompt);
                let suggestions: string[] = [];

                if (result.success && result.data) {
                    suggestions = result.data;
                    lastSuggestion = suggestions[0];

                    // Create InlineCompletionItems
                    const completionItems = suggestions.map(suggestion => new vscode.InlineCompletionItem(suggestion));

                    // Set suggestionStartTime when the suggestion is returned
                    const suggestionId = `${document.uri.toString()}-${position.line}-${position.character}`;
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
 * Handles text document changes and logs whether an AI suggestion was accepted or rejected.
 *
 * @param {vscode.TextDocumentChangeEvent} event - The text document change event.
 */
function handleTextChange(event: vscode.TextDocumentChangeEvent) {
    event.contentChanges.forEach(change => {
        const suggestionId = `${event.document.uri.toString()}-${change.range.start.line}-${change.range.start.character}`;
        const isDeletion = change.text === "" && !change.range.isEmpty;

        if (!suggestionStartTime.has(suggestionId) || isDeletion) {
            return; // Ignore changes that aren't tied to a suggestion
        }

        const startTime = suggestionStartTime.get(suggestionId) || 0;
        const elapsedTime = Date.now() - startTime;

        console.log(`Suggestion ID: ${suggestionId}`);
        console.log(`Last suggestion: ${lastSuggestion}`);
        
        if (!lastSuggestion || lastSuggestion.trim() === "") {
            console.log("No active suggestion, ignoring.");
            return;
        }

        const normalize = (str: string) => str.replace(/\r\n/g, "\n").trim();
        const isFullyAccepted = normalize(change.text) === normalize(lastSuggestion);

        const logEventType = isFullyAccepted ? LogEvent.USER_ACCEPT : LogEvent.USER_REJECT;
        const logData: LogData = {
            event: logEventType,
            time_lapse: elapsedTime,
            metadata: { userId: "12345", suggestionId, hasBug: false }
        };

        trackEvent(logData);
        
        suggestionStartTime.delete(suggestionId);
        lastSuggestion = "";
    });
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
    console.log("AI Extension Deactivated");
}
