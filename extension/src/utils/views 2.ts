import * as vscode from 'vscode';

/**
 * Creates a Webview panel to display two code snippets side by side.
 *
 * @param rigthCode - The original code snippet.
 * @param wrongCode - The suggested code snippet.
 */
export const createCodeComparisonWebview = (rigthCode: string, wrongCode: string) => {
    // Create a new Webview panel
    const panel = vscode.window.createWebviewPanel(
        'codeComparison', // Unique ID for the panel
        'Code Comparison', // Title of the panel
        vscode.ViewColumn.Beside, // Show the panel beside the active editor
        {
            enableScripts: true, // Enable JavaScript in the Webview
            retainContextWhenHidden: true, // Retain the Webview's state when hidden
        }
    );

    // Render the HTML content
    panel.webview.html = getWebviewContent(rigthCode, wrongCode);
};

/**
 * Generates the HTML content for the Webview.
 *
 * @param rigthCode - The original code snippet.
 * @param wrongCode - The suggested code snippet.
 * @returns The HTML content as a string.
 */
const getWebviewContent = (rigthCode: string, wrongCode: string): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Comparison</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    height: 100vh;
                }
                .code-container {
                    flex: 1;
                    padding: 10px;
                    box-sizing: border-box;
                    overflow: auto;
                }
                .code-container:first-child {
                    border-right: 1px solid #ccc;
                }
                pre {
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
            </style>
        </head>
        <body>
            <div class="code-container">
                <h3>Correct Code</h3>
                <pre>${escapeHtml(rigthCode)}</pre>
            </div>
            <div class="code-container">
                <h3>Incorrect Code</h3>
                <pre>${escapeHtml(wrongCode)}</pre>
            </div>
        </body>
        </html>
    `;
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * @param text - The text to escape.
 * @returns The escaped text.
 */
const escapeHtml = (text: string): string => 
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
