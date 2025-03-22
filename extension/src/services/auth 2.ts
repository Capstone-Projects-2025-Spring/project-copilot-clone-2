import * as vscode from 'vscode';
import { getSupabaseClient } from '../configs/supabaseClient';
import { LogData, LogEvent } from '../types/event';
import { trackEvent } from '../api/log';
import { AUTH_CONTEXT } from '../types/user';
import { globalContext } from '../extension';
import { registerUser } from '../api/user';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sets the authentication context for the user in the global state.
 * This includes user information, session data, and authentication status.
 *
 * @param {Object} user - The user object containing id and email.
 * @param {Object} session - The session object from Supabase.
 * @param {boolean} isAuthenticated - Indicates if the user is authenticated.
 */
async function setAuthContext(
    user: { id?: string; email?: string },
    session: any, 
    isAuthenticated: boolean = false
) {
    if (!user || !globalContext) {
        throw new Error("Invalid user or context provided.");
    }

    const authContext = {
        user,
        session, 
        isAuthenticated,
    };

    await globalContext.globalState.update(AUTH_CONTEXT, authContext);
}


/**
 * Checks if a user is already signed in. If not, prompts them to sign in.
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
export async function checkUserSignIn(context: vscode.ExtensionContext) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client initialization failed.');
    }

    const storedAuth = context.globalState.get(AUTH_CONTEXT) as {
        user?: { id: string; email: string };
        session?: any;
        isAuthenticated?: boolean;
    };

    if (storedAuth?.isAuthenticated && storedAuth.session) {
        await supabase.auth.setSession(storedAuth.session);
        vscode.window.showInformationMessage(`Welcome back, ${storedAuth.user?.email}! 🎉`);
        return;
    }

    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData?.session?.user) {
        const user = sessionData.session.user;
        await setAuthContext({ id: user.id, email: user.email }, sessionData.session, true);
        vscode.window.showInformationMessage(`Welcome back, ${user.email}! 🎉`);
    } else {
        const choice = await vscode.window.showInformationMessage(
            "You are not authenticated. Please sign in to track your progress!",
            "Sign In"
        );

        if (choice === "Sign In") {
            await signIn(context);
        }
    }
}

/**
 * Handles user sign-in, allowing them to select between email or GitHub authentication.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
export async function signIn(context: vscode.ExtensionContext){
    const authContext = globalContext.globalState.get(AUTH_CONTEXT) as { isAuthenticated?: boolean };

    const supabase = getSupabaseClient();
    if (!supabase) {
        vscode.window.showErrorMessage('Supabase client initialization failed.');
        return;
    }

    if (authContext && authContext.isAuthenticated) {
        const signOutChoice = await vscode.window.showInformationMessage(
            `You are already signed in.`,
            'Sign Out'
        );

        if (signOutChoice === 'Sign Out') {
            await handleSignOut(supabase);
        }
    } else {
        const signInMethod = await vscode.window.showQuickPick(['Sign in with Email', 'Sign in with GitHub'], { placeHolder: 'Choose a sign-in method' });

        if (signInMethod === 'Sign in with Email') {
            signInOrSignUpEmail(context);
        } else if (signInMethod === 'Sign in with GitHub') {
            signInWithGithub(context);
        }
    }
}

/**
 * Signs in or signs up a user using an email and password.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
//want to make it to sign up but need to look at database, this works for now 
async function signInOrSignUpEmail(context: vscode.ExtensionContext) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        vscode.window.showErrorMessage('Supabase client initialization failed.');
        return;
    }

    const action = await vscode.window.showQuickPick(["Sign In", "Sign Up"], { 
        placeHolder: "Do you want to sign in or sign up?" 
    });

    if (!action) { return; }

    if (action === "Sign In") {
        await handleSignIn(supabase);
    } else {
        await handleSignUp(supabase);
    }
}

/**
 * Handles user sign-in using email and password.
 *
 * @param {SupabaseClient} supabase - The Supabase client instance.
 */
async function handleSignIn(supabase: SupabaseClient) {
    const email = await vscode.window.showInputBox({ prompt: 'Enter your email', placeHolder: "sample@gmail.com" });
    if (!email) { return; }

    const password = await vscode.window.showInputBox({ prompt: 'Enter your password', placeHolder: "password", password: true });
    if (!password) { return; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        vscode.window.showErrorMessage(`Sign In failed: ${error.message}`);
    } else {
        const id = data.user?.id as string;
        await setAuthContext({ id, email }, data.session, true);
        vscode.window.showInformationMessage("Sign In successful! 🎉");

        trackEvent({
            event: LogEvent.USER_LOGIN,
            timeLapse: 0,
            metadata: { user_id: id, email }
        });
    }
}

/**
 * Handles user sign-out and updates the global authentication context.
 *
 * @param {SupabaseClient} supabase - The Supabase client instance.
 */
async function handleSignOut(supabase: SupabaseClient) {
    const { error } = await supabase.auth.signOut();

    if (error) {
        vscode.window.showErrorMessage(`Sign Out failed: ${error.message}`);
    } else {
        const user = await globalContext.globalState.get(AUTH_CONTEXT) as { user?: { id: string; email: string } };
        await globalContext.globalState.update(AUTH_CONTEXT, undefined);
        vscode.window.showInformationMessage("Sign Out successful! 👋");

        trackEvent({
            event: LogEvent.USER_LOGOUT,
            timeLapse: 0,
            metadata: { user_id: user.user?.id }
        });
    }
}

/**
 * Handles user sign-up using email and password, and registers the user in the backend.
 *
 * @param {SupabaseClient} supabase - The Supabase client instance.
 */
async function handleSignUp(supabase: SupabaseClient) {
    const firstName = await vscode.window.showInputBox({ prompt: 'Enter your first name', placeHolder: "Example: John" });
    if (!firstName) { return; }

    const lastName = await vscode.window.showInputBox({ prompt: 'Enter your last name', placeHolder: "Example: Doe" });
    if (!lastName) { return; }

    const email = await vscode.window.showInputBox({ prompt: 'Enter your email', placeHolder: "sample@gmail.com" });
    if (!email) { return; }

    const password = await vscode.window.showInputBox({ prompt: 'Enter your password', placeHolder: "password", password: true });
    if (!password) { return; }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        vscode.window.showErrorMessage(`Sign Up failed: ${error.message}`);
    } else {
        const id = data.user?.id as string;
        vscode.window.showInformationMessage("Sign Up successful! 🎉");

        try {
            await registerUser(id, firstName, lastName, email);
            await setAuthContext({ id, email }, data.session, true);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to register user in backend: ${err.message}`);
        }

        trackEvent({
            event: LogEvent.USER_SIGNUP,
            timeLapse: 0,
            metadata: { user_id: id, email: email }
        });
    }
}

/**
 * Signs in a user using GitHub OAuth authentication.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
export async function signInWithGithub(context: vscode.ExtensionContext){  
    const supabase = getSupabaseClient();
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
                timeLapse: 0,
                metadata: { user_id: user.id, email: user.email }
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