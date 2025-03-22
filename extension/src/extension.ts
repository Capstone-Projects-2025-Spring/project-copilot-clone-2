import * as vscode from 'vscode';
import { fetchSuggestions } from './api/suggestion';
import { acceptSuggestion, rejectSuggestion, provideInlineCompletionItems } from './services/suggestion';
import { getIncorrectChoices } from './incorrectTracker';
import { checkUserSignIn, signIn } from './services/auth';

/**
 * Global context for the VS Code extension. This is used to store state and configuration
 */
export let globalContext: vscode.ExtensionContext;

/**
 * Activates the VS Code extension.
 *
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
    globalContext = context;

    console.log("AI Extension Activated");

    await checkUserSignIn(context);

    context.subscriptions.push(
        acceptSuggestion,
        incorrectChoicesCommand,
        rejectSuggestion,
        // Sign in with email command 
        vscode.commands.registerCommand('clover.signIn', () => signIn(context)),
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
const testFetchCommand = vscode.commands.registerCommand(
    'clover.testFetch',
    async () => {
        
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
const incorrectChoicesCommand = vscode.commands.registerCommand('clover.viewIncorrectChoices', async () => {
    const userId = "12345";
    const incorrectChoices = getIncorrectChoices(userId);
    
    if (incorrectChoices.length === 0){
        vscode.window.showInformationMessage("User does has not chosen an incorrect code suggestion.");
    } else {
        vscode.window.showInformationMessage(`Incorrect Choices:\n${incorrectChoices.map(choice => `- ${choice.suggestion}`).join("\n")}`);
    }
});

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