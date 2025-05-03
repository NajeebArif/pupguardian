import * as vscode from 'vscode';
import { getPuppySprite } from './assets/sprites';

let statusBarItem: vscode.StatusBarItem;
let nextBreakTimer: NodeJS.Timeout;

export interface GameState {
    workMinutes: number;
    xp: number;
    level: number;
    accessories: string[];
    addXP: (points: number) => void;
    getCurrentSprite: () => string;
    isInBreak: boolean;
    readonly onDidChange: vscode.Event<void>;
    currentStreak: number;
    lastBreakTime?: number;
}

export function setupGamification(context: vscode.ExtensionContext): GameState {
    const storedState = context.globalState.get<Partial<GameState>>('gameState') || {};
    const changeEmitter = new vscode.EventEmitter<void>();
    
    const state: GameState = {
        workMinutes: storedState.workMinutes || 0,
        xp: storedState.xp || 0,
        level: storedState.level || 1,
        currentStreak: storedState.currentStreak || 0,
        accessories: storedState.accessories || ['bandana'],
        lastBreakTime: storedState.lastBreakTime,
        addXP(points: number) {
            this.xp += points;
            const xpNeeded = this.level * 100;
            if (this.xp >= xpNeeded) {
                this.level++;
                this.xp = 0;
                vscode.window.showInformationMessage(`Level Up! 🎉 Now Level ${this.level}`);
                
                if (this.level >= 3 && !this.accessories.includes('sunglasses')) {
                    this.accessories.push('sunglasses');
                    vscode.window.showInformationMessage('New accessory unlocked!');
                }
            }
            context.globalState.update('gameState', {
                xp: this.xp,
                level: this.level,
                accessories: this.accessories
            });

            changeEmitter.fire();
            refreshStatusBar(context, this);
        },
        onDidChange: changeEmitter.event,
        getCurrentSprite() { // Fixed: Proper method syntax binds 'this'
            return getPuppySprite({
                accessories: this.accessories
            });
        },
        isInBreak: false,
    };

    return state;
}

function updateStatusBar(context: vscode.ExtensionContext, gameState: GameState, minutesUntilBreak: number) {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'pupguardian.showDashboard';
        context.subscriptions.push(statusBarItem);
    }

    // Dynamic icon based on time remaining
    const urgencyIcon = minutesUntilBreak <= 5 ? '$(warning)' : '$(clock)';
    
    statusBarItem.text = `$(paw) Lv.${gameState.level} | ${gameState.xp}/${gameState.level * 100}XP ${urgencyIcon}`;
    
    // Dynamic tooltip with countdown
    const nextBreakTime = new Date();
    nextBreakTime.setMinutes(nextBreakTime.getMinutes() + minutesUntilBreak);
    
    statusBarItem.tooltip = new vscode.MarkdownString(
        `**Next Break**: ${minutesUntilBreak} min (${nextBreakTime.toLocaleTimeString()})\n` +
        `**Streak**: ${gameState.currentStreak} days\n` +
        `**Accessories**: ${gameState.accessories.join(', ') || 'None'}\n\n` +
        `[Settings](command:pupguardian.openSettings) | ` +
        `[Snooze](command:pupguardian.snoozeBreak)`
    );

    statusBarItem.show();
}

function refreshStatusBar(context: vscode.ExtensionContext, gameState: GameState) {
    const config = vscode.workspace.getConfiguration('pupguardian');
    const workDuration = config.get<number>('workDuration', 20);
    const elapsedMinutes = gameState.workMinutes;
    const minutesUntilBreak = workDuration - elapsedMinutes;
    
    updateStatusBar(context, gameState, minutesUntilBreak);
}
