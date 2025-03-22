import * as vscode from 'vscode';
import { getSupabaseClient } from '../configs/supabaseClient';
import { LogData, LogEvent } from '../types/event';
import { trackEvent } from '../api/log';
import { AUTH_CONTEXT } from '../types/user';
import { globalContext } from '../extension';

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
    isAuthenticated: boolean
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
    const supabase = await getSupabaseClient(context);
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
export async function signInOrSignUpEmail(context: vscode.ExtensionContext) {
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
        await setAuthContext({ id: data.user?.id, email: data.user?.email }, data.session, true);
        vscode.window.showInformationMessage(`${action} successful! 🎉`);
        const logData: LogData = {
            event: logEventType,
            timeLapse: 0,
            metadata: { user_id: data.user?.id, email: data.user?.email }
        };

        trackEvent(logData);
    }
}

/**
 * Signs in a user using GitHub OAuth authentication.
 *
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
export async function signInWithGithub(context: vscode.ExtensionContext){  
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