import * as vscode from 'vscode';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
/**
 * Initializes a Supabase client using environment variables.
 *
 * @returns {SupabaseClient | null} The initialized Supabase client, or null if credentials are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_KEY;

    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Supabase Key:", process.env.SUPABASE_KEY ? "Loaded" : "Not Found");

    if (!supabaseUrl || !supabaseAnonKey) {
        vscode.window.showErrorMessage("Supabase credentials missing. Please check your environment variables.");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// /**
//  * Checks if Supabase credentials are stored in VS Code's secret storage.
//  * If missing, it retrieves them from environment variables and stores them securely.
//  *
//  * @param {vscode.SecretStorage} secretStorage - The VS Code secret storage API for persisting credentials.
//  * @returns {Promise<void>} A promise that resolves when credentials are checked and stored if necessary.
//  */
// export async function checkAndStoreSupabaseSecrets(secretStorage: vscode.SecretStorage): Promise<void> {
//     if (!(await secretStorage.get('SUPABASE_URL'))) {
//         const supabaseUrl = process.env.SUPABASE_URL;
//         const supabaseAnonKey = process.env.SUPABASE_KEY;

//         if (supabaseUrl && supabaseAnonKey) {
//             await secretStorage.store('SUPABASE_URL', supabaseUrl);
//             await secretStorage.store('SUPABASE_ANON_KEY', supabaseAnonKey);
//         } else {
//             vscode.window.showErrorMessage('Supabase environment variables are not set.');
//         }
//     }
// }
