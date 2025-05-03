import * as vscode from 'vscode';

export class SettingsPanel {
    private static currentPanel: SettingsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(context: vscode.ExtensionContext) {
        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'pupSettings',
            'PupGuardian Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        SettingsPanel.currentPanel = new SettingsPanel(panel, context);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._updateWebview(context);
        
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message, context),
            undefined,
            this._disposables
        );
    }

    private _handleMessage(message: any, context: vscode.ExtensionContext) {
        switch (message.command) {
            case 'requestSettings':
                this._sendSettings();
                break;
            case 'applySettings':
                this._applySettings(message.settings);
                break;
        }
    }

    private async _applySettings(settings: any) {
        const config = vscode.workspace.getConfiguration('pupguardian');
        
        await Promise.all([
            config.update('enableHardcoreMode', settings.hardcoreMode, vscode.ConfigurationTarget.Global),
            config.update('workDuration', Number(settings.workDuration), vscode.ConfigurationTarget.Global),
            config.update('breakDuration', Number(settings.breakDuration), vscode.ConfigurationTarget.Global),
            config.update('enableSounds', settings.enableSounds, vscode.ConfigurationTarget.Global)
        ]);

        console.log('[PupGuardian] Settings applied:', settings);
        vscode.window.showInformationMessage('PupGuardian settings saved!');
        this._sendSettings(); // Refresh UI
    }

    private _sendSettings() {
        const config = vscode.workspace.getConfiguration('pupguardian');
        this._panel.webview.postMessage({
            command: 'loadSettings',
            settings: {
                hardcoreMode: config.get('enableHardcoreMode'),
                workDuration: config.get('workDuration'),
                breakDuration: config.get('breakDuration'),
                enableSounds: config.get('enableSounds')
            }
        });
    }

    private _updateWebview(context: vscode.ExtensionContext) {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>PupGuardian Settings</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .setting-group {
                    margin-bottom: 20px;
                    border: 1px solid var(--vscode-input-border);
                    padding: 15px;
                    border-radius: 5px;
                }
                .setting-item {
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 52px;
                    height: 26px;
                    margin-right: 10px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: #2196F3;
                }
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
                input[type="number"] {
                    width: 60px;
                    padding: 5px;
                    margin-left: 10px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 14px;
                    margin: 10px 0;
                    cursor: pointer;
                    border-radius: 2px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                label {
                    margin-right: 10px;
                }
                .description {
                    margin-bottom: 20px;
                    line-height: 1.5;
                    color: var(--vscode-descriptionForeground);
                }
                .recommended {
                    font-size: 0.9em;
                    color: var(--vscode-inputValidation-infoBorder);
                    margin-left: 5px;
                }
                .feature-desc {
                    font-size: 0.85em;
                    margin: 5px 0 15px 0;
                    color: var(--vscode-foreground);
                    opacity: 0.8;
                }
            </style>
        </head>
        <body>
            <h1>🐶 PupGuardian Settings</h1>

            <div class="description">
                <p>PupGuardian is your coding companion that <strong>protects your eyesight</strong> using the 20/20/20 rule: 
                Every 20 minutes, look at something 20 feet away for 20 seconds.</p>
                
                <p>This extension helps prevent digital eye strain by:</p>
                <ul>
                    <li>🛡️ Enforcing regular breaks</li>
                    <li>🎮 Making eye care fun with gamification</li>
                    <li>📊 Tracking your healthy habits</li>
                </ul>
            </div>
            
            <div class="setting-group">
                <h3>⏰ Break Rules</h3>
                <p class="feature-desc">Customize when and how long breaks should occur</p>
                
                <div class="setting-item">
                    <label for="workDuration">Work Duration (mins):</label>
                    <input type="number" id="workDuration" min="1" max="120">
                    <span class="recommended">Recommended: 20</span>
                </div>
                
                <div class="setting-item">
                    <label for="breakDuration">Break Duration (secs):</label>
                    <input type="number" id="breakDuration" min="5" max="60">
                    <span class="recommended">Recommended: 20</span>
                </div>

                <p class="feature-desc">
                    <strong>Pro Tip:</strong> Start with shorter intervals (e.g., 15min work / 15sec breaks) 
                    if you're new to the 20/20/20 rule.
                </p>
            </div>
            
            <div class="setting-group">
                <h3>✨ Features</h3>
                <p class="feature-desc">Toggle these to customize your experience</p>
            
                
                <div class="setting-item">
                    <label class="switch">
                        <input type="checkbox" id="hardcoreMode">
                        <span class="slider"></span>
                    </label>
                    <label for="hardcoreMode">Hardcore Mode</label>
                    <span class="recommended">(Blocks editor during breaks)</span>

                    
                </div>

                <p class="feature-desc">
                        When enabled, PupGuardian will <strong>prevent skipping breaks</strong> by temporarily 
                        freezing your code editor until the break completes.
                </p>
                
                <div class="setting-item">
                    <label class="switch">
                        <input type="checkbox" id="enableSounds">
                        <span class="slider"></span>
                    </label>
                    <label for="enableSounds">Enable Sounds</label>
                    <span class="recommended">(Gentle notifications)</span>
                </div>

                <p class="feature-desc">
                    Play subtle sound effects when breaks start/end. Volume follows VS Code's 
                    notification settings.
                </p>
            </div>
            
            
            <button id="applyButton">💾 Apply Settings</button>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Load current settings
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'loadSettings') {
                        document.getElementById('hardcoreMode').checked = message.settings.hardcoreMode;
                        document.getElementById('enableSounds').checked = message.settings.enableSounds;
                        document.getElementById('workDuration').value = message.settings.workDuration;
                        document.getElementById('breakDuration').value = message.settings.breakDuration;
                    }
                });
                
                // Apply button handler
                document.getElementById('applyButton').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'applySettings',
                        settings: {
                            hardcoreMode: document.getElementById('hardcoreMode').checked,
                            enableSounds: document.getElementById('enableSounds').checked,
                            workDuration: document.getElementById('workDuration').value,
                            breakDuration: document.getElementById('breakDuration').value
                        }
                    });
                });
                
                // Request settings on load
                vscode.postMessage({ command: 'requestSettings' });
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        SettingsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}