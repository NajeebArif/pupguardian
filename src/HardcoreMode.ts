import * as vscode from 'vscode';
import { GameState } from './Gamification';

export function activateHardcoreMode(context: vscode.ExtensionContext, gameState: GameState, breakSeconds: number) {
    const panel = vscode.window.createWebviewPanel(
        'hardcoreBreak',
        'PupGuardian Break',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getBreakHtml();

    const breakStartTime = Date.now();
    const breakDuration = breakSeconds * 1000;

    const forceFocusInterval = setInterval(() => {
        panel.reveal();
    }, 1000);

    panel.onDidDispose(() => {
        clearInterval(forceFocusInterval);
        if (Date.now() < breakStartTime + breakDuration) {
            vscode.window.showWarningMessage("Break skipped! -50 XP");
            gameState.addXP(-50);
        }
    });

    function getBreakHtml() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        background: #1e1e1e; 
                        color: white;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: Arial;
                        text-align: center;
                    }
                    #countdown {
                        font-size: 5em;
                        margin: 20px;
                        color: #ff5555;
                    }
                    .pup {
                        font-size: 10em;
                        animation: bounce 0.5s infinite alternate;
                    }
                    @keyframes bounce {
                        from { transform: translateY(0); }
                        to { transform: translateY(-20px); }
                    }
                </style>
            </head>
            <body>
                <div class="pup">${gameState.getCurrentSprite()}</div>
                <h1>Look at something 20 feet away!</h1>
                <div id="countdown">${breakSeconds}</div>
                <p>Your code will be available soon!</p>
                
                <script>
                    let seconds = ${breakSeconds};
                    const countdown = setInterval(() => {
                        seconds--;
                        document.getElementById('countdown').textContent = seconds;
                        if (seconds <= 0) {
                            clearInterval(countdown);
                            document.body.innerHTML = '<h1>Break complete! +100 XP</h1>';
                            setTimeout(() => vscode.postMessage('complete'), 1000);
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `;
    }
}