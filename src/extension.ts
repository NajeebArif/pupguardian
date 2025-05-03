import * as vscode from 'vscode';
import { SettingsPanel } from './SettingsPanel';
import { activateHardcoreMode } from './HardcoreMode';
import { GameState, setupGamification } from './Gamification';
import { PUPPY_SPRITES } from './assets/sprites';

interface BreakState {
    isActive: boolean;
    timer?: NodeJS.Timeout;
    sessionCount: number;
}

let puppy: vscode.StatusBarItem;

let state: {
    isActive: boolean;
    timer?: NodeJS.Timeout;
    sessionCount: number;
} = { isActive: false, sessionCount: 0 };

function initializePuppy(gameState: GameState) {
    puppy.text = gameState.getCurrentSprite();
    puppy.tooltip = "PupGuardian - Your eye health companion";
}

export function activate(context: vscode.ExtensionContext) {
    const gameState = setupGamification(context);
    
    // Initialize status bar
    puppy = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updatePuppySprite(gameState);
    puppy.show();

    // Start the first work session
    scheduleNextBreak(context, gameState);

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('pupguardian.openSettings', () => {
            SettingsPanel.createOrShow(context);
        }),
        puppy,
        new vscode.Disposable(() => {
            if (state.timer) {clearTimeout(state.timer);}
        })
    );

    // Reset on config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('pupguardian')) {
                resetScheduler(context, gameState);
            }
        })
    );
}

function updatePuppySprite(gameState: GameState) {
    puppy.text = gameState.getCurrentSprite();
    puppy.tooltip = `Level ${gameState.level} | XP: ${gameState.xp}/${gameState.level * 100}`;
}

function resetScheduler(context: vscode.ExtensionContext, gameState: GameState) {
    if (state.timer) {clearTimeout(state.timer);}
    state = { isActive: false, sessionCount: 0 };
    scheduleNextBreak(context, gameState);
}

function scheduleNextBreak(context: vscode.ExtensionContext, gameState: GameState) {
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
    
    const breakPromise = config.get('enableHardcoreMode')
        ? activateHardcoreMode(context, gameState, breakSeconds)
        : showRegularBreak(context, gameState, breakSeconds);

    breakPromise.finally(() => {
        state.isActive = false;
        puppy.text = gameState.getCurrentSprite();
        scheduleNextBreak(context, gameState);
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

async function showRegularBreak(context: vscode.ExtensionContext, gameState: GameState, breakSeconds: number): Promise<void> {
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
                puppy.text = originalSprite;
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
                            gameState.isInBreak = false;
                            resolve();
                        }
                    }, 1000);
                    break;

                case 'snooze':
                    vscode.window.showInformationMessage('⏸️ Break snoozed for 5 minutes');
                    puppy.text = originalSprite;
                    gameState.isInBreak = false;
                    setTimeout(() => triggerBreak(context, gameState), 300000); // 5 min
                    resolve();
                    break;
            }
        });
    });
}

export function deactivate() {
    if (state.timer) {clearTimeout(state.timer);}
}