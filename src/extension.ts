import * as vscode from 'vscode';
import { SettingsPanel } from './SettingsPanel';
import { GameState, setupGamification } from './Gamification';
import { resetScheduler, scheduleNextBreak } from './BreakeManager';
import { PUPPY_SPRITES } from './assets/sprites';

let stateBar: vscode.StatusBarItem;

let state: {
    isActive: boolean;
    timer?: NodeJS.Timeout;
    sessionCount: number;
} = { isActive: false, sessionCount: 0 };

export function activate(context: vscode.ExtensionContext) {
    const gameState = setupGamification(context);

    const puppy = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    puppy.text = "🐶";
    puppy.tooltip = "Pup Guardian is active";
    puppy.show();
    gameState.addXP(0);

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

export function deactivate() {
    if (state.timer) {clearTimeout(state.timer);}
}

