import * as vscode from 'vscode';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
/**
 * Retrieves stored Supabase credentials from VS Code's secret storage and initializes a Supabase client.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 * @returns {Promise<SupabaseClient | null>} The initialized Supabase client, or null if credentials are missing.
 */
export async function getSupabaseClient(context: vscode.ExtensionContext): Promise<SupabaseClient | null> {
    if (supabase){
        return supabase;
    }
    const secretStorage = context.secrets;

    // Retrieve stored credentials
    const supabaseUrl = await secretStorage.get("SUPABASE_URL");
    const supabaseAnonKey = await secretStorage.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
        vscode.window.showErrorMessage("Supabase credentials missing. Please restart VS Code.");
        return null;
    }

    // Return Supabase client instance
    return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Check if user is authenticated
 * 
 * @returns {Promise<Session | null>} The current session, or null if the user is not authenticated.
 */
export async function getAuthenticatedSess(): Promise<Session | null> {
    if (!supabase) {
        return null;
    }
    const {data, error} = await supabase.auth.getSession();

    if (error) {
        vscode.window.showErrorMessage(`Failed to get session: ${error.message}`);
        return null;
    }

    return data?.session ?? null;
}
/**
 * Checks if Supabase credentials are stored in VS Code's secret storage.
 * If missing, it retrieves them from environment variables and stores them securely.
 *
 * @param {vscode.SecretStorage} secretStorage - The VS Code secret storage API for persisting credentials.
 * @returns {Promise<void>} A promise that resolves when credentials are checked and stored if necessary.
 */
export async function checkAndStoreSupabaseSecrets(secretStorage: vscode.SecretStorage): Promise<void> {
    if (!(await secretStorage.get('SUPABASE_URL'))) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_KEY;

        if (supabaseUrl && supabaseAnonKey) {
            await secretStorage.store('SUPABASE_URL', supabaseUrl);
            await secretStorage.store('SUPABASE_ANON_KEY', supabaseAnonKey);
        } else {
            vscode.window.showErrorMessage('Supabase environment variables are not set.');
        }
    }
}
