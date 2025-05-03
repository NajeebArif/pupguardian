import * as vscode from 'vscode';
import { GameState } from './Gamification';
import { PUPPY_SPRITES } from './assets/sprites';

let state: {
    isActive: boolean;
    timer?: NodeJS.Timeout;
    sessionCount: number;
} = { isActive: false, sessionCount: 0 };


export function resetScheduler(context: vscode.ExtensionContext, gameState: GameState) {
    if (state.timer) {clearTimeout(state.timer);}
    state = { isActive: false, sessionCount: 0 };
    scheduleNextBreak(context, gameState);
}

export function scheduleNextBreak(context: vscode.ExtensionContext, gameState: GameState) {
    if (state.isActive) {return;}

    const config = vscode.workspace.getConfiguration('pupguardian');
    const workMinutes = config.get<number>('workDuration', 20);
    
    state.timer = setTimeout(() => {
        state.sessionCount++;
        triggerBreak(context, gameState);
    }, workMinutes * 60 * 1000);

    console.log(`Next break in ${workMinutes} minutes`);
}

function triggerBreak(context: vscode.ExtensionContext, gameState: GameState) {
    if (state.isActive || gameState.isInBreak) return;
    
    state.isActive = true;
    const config = vscode.workspace.getConfiguration('pupguardian');
    const breakSeconds = getBreakDuration(config);

    const isHardcore = config.get('enableHardcoreMode');
    
    const breakPromise = isHardcore
        ? activateHardcoreMode(context, gameState, breakSeconds)
        : showRegularBreak(context, gameState, breakSeconds);

    breakPromise.finally(() => {
        state.isActive = false;
        scheduleNextBreak(context, gameState);
    });
}

async function showRegularBreak(context: vscode.ExtensionContext, gameState: GameState, breakSeconds: number): Promise<void> {
    const puppy = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    puppy.text = gameState.getCurrentSprite();
    puppy.show();
    context.subscriptions.push(puppy);
    return new Promise((resolve) => {
        if (gameState.isInBreak) return;
        gameState.isInBreak = true;

        const originalSprite = gameState.getCurrentSprite();
        let countdownInterval: NodeJS.Timeout | undefined;
        let remaining = breakSeconds;

        // Persistent notification
        const breakPromise = vscode.window.showInformationMessage(
            `🐶 ${PUPPY_SPRITES.looking} Time for a ${breakSeconds}s break!`,
            { modal: false },
            { title: "Start Break", action: 'start' },
            { title: "Snooze 5min", action: 'snooze' }
        );

        breakPromise.then(selection => {
            if (!selection) {
                // User closed the notification
                puppy.text = PUPPY_SPRITES.warning;
                gameState.isInBreak = false;
                resolve();
                return;
            }

            switch (selection.action) {
                case 'start':
                    puppy.text = `⏳ ${remaining}s`;
                    countdownInterval = setInterval(() => {
                        remaining--;
                        puppy.text = `⏳ ${remaining}s`;
                        
                        if (remaining <= 0) {
                            clearInterval(countdownInterval);
                            puppy.text = gameState.getCurrentSprite();
                            gameState.addXP(50);
                            gameState.isInBreak = false;
                            resolve();
                        }
                    }, 1000);
                    break;

                case 'snooze':
                    vscode.window.showInformationMessage('⏸️ Break snoozed for 5 minutes');
                    puppy.text = PUPPY_SPRITES.sleeping;
                    gameState.isInBreak = false;
                    gameState.addXP(-100);
                    setTimeout(() => triggerBreak(context, gameState), 300000); // 5 min
                    resolve();
                    break;
            }
        });
    });
}


function getBreakDuration(config: vscode.WorkspaceConfiguration): number {
    const baseDuration = config.get<number>('breakDuration', 20);
    const longBreakInterval = config.get<number>('longBreakInterval', 4);
    const multiplier = config.get<number>('longBreakMultiplier', 1.5);

    return state.sessionCount % longBreakInterval === 0
        ? Math.floor(baseDuration * multiplier)
        : baseDuration;
}



export async function activateHardcoreMode(
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

