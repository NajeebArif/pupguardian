
import * as vscode from 'vscode';
import { GameState } from './Gamification';
import { PUPPY_SPRITES } from './assets/sprites';

export class HardcoreModeManager {
    private activePanel?: vscode.WebviewPanel;

    constructor(private context: vscode.ExtensionContext) { }

    public async startBreak(
        context: vscode.ExtensionContext,
        gameState: GameState,
        breakSeconds: number
    ): Promise<void> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'hardcoreBreak',
                'PupGuardian Break',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            let remaining = breakSeconds;
            let interval: NodeJS.Timeout;

            const updateWebview = () => {
                panel.webview.html = `
                        <html>
                        <body style="
                            background: #1e1e1e;
                            color: white;
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            text-align: center;
                        ">
                            <div style="text-align: center; font-size: 4em">
                                ${gameState.getCurrentSprite()}
                            </div>
                            <h1>🛑 Hardcore Break Active</h1>
                            <div style="font-size: 3em; margin: 20px;">${remaining}s</div>
                            <p>Focus on something 20ft away!</p>
                        </body>
                        </html>
                    `;
            };

            interval = setInterval(() => {
                remaining--;
                updateWebview();

                if (remaining <= 0) {
                    clearInterval(interval);
                    panel.dispose();
                    resolve();
                }
            }, 1000);

            panel.onDidDispose(() => {
                clearInterval(interval);
                if (remaining > 0) {
                    vscode.window.showWarningMessage(`Break skipped! -50 XP`);
                    gameState.addXP(-50);
                }
                resolve();
            });

            updateWebview();
        });
    }

    dispose() {
        this.activePanel?.dispose();
    }
}