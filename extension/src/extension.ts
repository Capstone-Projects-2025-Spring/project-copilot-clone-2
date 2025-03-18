import * as vscode from 'vscode';
import { checkAndStoreSupabaseSecrets, getSupabaseClient } from './auth/supabaseClient';
import { LogData, LogEvent } from './types/event';
import { trackEvent } from './api/log';
import { fetchSuggestions } from './api/suggestion';
import { acceptSuggestion, rejectSuggestion, provideInlineCompletionItems } from './services/suggestion';
import { getIncorrectChoices, trackIncorrectChoices } from './incorrectTracker';


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

// Debug command to force a fetch using input from the user.
const testFetchCommand = vscode.commands.registerCommand('copilotClone.testFetch', async () => {
    const userInput = await vscode.window.showInputBox({
        prompt: 'Enter prompt for suggestion.',
    });
    console.log("Test Fetch: \"" + userInput + "\"");

    if (userInput) {
        try {
            const result = await fetchSuggestions(userInput);
            if (result.success) {
                vscode.window.showInformationMessage(`Suggestions: ${result.data.suggestions.join(", ")}`);
            } else {
                vscode.window.showErrorMessage(`Error: ${result.error}`);
            }
            console.log(result);
        
        } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    }
});

// Show incorrect choices
const incorrectChoicesCommand = vscode.commands.registerCommand('copilotClone.viewIncorrectChoices', async () => {
    const userId = "12345";
    const incorrectChoices = getIncorrectChoices(userId);
    
    if (incorrectChoices.length === 0){
        vscode.window.showInformationMessage("User does has not chosen an incorrect code suggestion.");
    } else {
        vscode.window.showInformationMessage(`Incorrect Choices:\n${incorrectChoices.map(choice => `- ${choice.suggestion}`).join("\n")}`);
    }
});


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

    if (!action) {return;}

    const email = await vscode.window.showInputBox({ prompt: 'Enter your email', placeHolder: "sample@gmail.com" });
    if (!email) {return;}

    const password = await vscode.window.showInputBox({ prompt: 'Enter your password', placeHolder: "password", password: true });
    if (!password) {return;}

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
            metadata: { time_lapse: 0, user_id: data.user?.id, email: data.user?.email }
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
                
                metadata: { time_lapse: 0, user_id: user.id, email: user.email }
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
 * Gets the settings for the AI model from the VS Code workspace configuration.
 * 
 * @returns {Object} The settings for the AI model, including model selection, temperature, top_k, top_p, and max_tokens.
 */
export function getSettings() {
    const vendor = vscode.workspace.getConfiguration("copilot-clone").get<string>("general.vendor");
    const model = vscode.workspace.getConfiguration("copilot-clone").get<string>("general.modelSelection");
    const temperature = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.temperature");
    const top_k = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.top_k");
    const top_p = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.top_p");
    const max_tokens = vscode.workspace.getConfiguration("copilot-clone").get<number>("model.maxTokens");

    return { vendor, model, temperature, top_k, top_p, max_tokens };
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
    console.log("AI Extension Deactivated");
}