import * as vscode from 'vscode';

export function showLoginWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'loginWebview',
        'Log in to Copilot Clone',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
        }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
        if (message === 'auth-success') {
            await context.globalState.update('supabaseSession', message.data);
            vscode.window.showInformationMessage('Logged in as ${message.data.user.email}!');
            panel.dispose();
        }
    },
    undefined,
    context.subscriptions

    );

    function getWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Supabase Login</title>
            <script>
                const vscode = acquireVsCodeApi();

                async function handleLogin() {
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    
                    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
                    
                    if (error) {
                        alert(error.message);
                    } else {
                        vscode.postMessage({ type: 'auth-success', data: user });
                    }
                }
            </script>
        </head>
        <body>
            <h2>Login to Supabase</h2>
            <input id="email" type="email" placeholder="Email" />
            <input id="password" type="password" placeholder="Password" />
            <button onclick="handleLogin()">Login</button>
        </body>
        </html>
        `
    ;
    }
}