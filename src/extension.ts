import * as vscode from 'vscode';
import { SettingsPanel } from './SettingsPanel';
import { activateHardcoreMode } from './HardcoreMode';
import { GameState, setupGamification } from './Gamification';

let workInterval: NodeJS.Timeout;
let sessionCount = 0;

export function activate(context: vscode.ExtensionContext) {
    // Initialize gamification
	console.log('Pup Guardian started!');
	const config = vscode.workspace.getConfiguration('pupguardian');
    const gameState = setupGamification(context);
    
    // Status Bar Puppy
    const puppy = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    puppy.text = gameState.getCurrentSprite();
    puppy.command = 'pupguardian.openSettings';
    puppy.show();

    // 20/20/20 Timer
    
    function startTimer() {
		const workMinutes = config.get<number>('workDuration', 20);
        const breakSeconds = config.get<number>('breakDuration', 20);

        workInterval = setInterval(() => {
            gameState.workMinutes++;
            if (gameState.workMinutes >= workMinutes) {
				sessionCount++;
                triggerBreak(breakSeconds);
                gameState.workMinutes = 0;
            }
        }, 60 * 1000);
    }

    function triggerBreak(breakSeconds: number) {
        const config = vscode.workspace.getConfiguration('pupguardian');
        
        // Check for long break
        const longBreakInterval = config.get<number>('longBreakInterval', 4);
        const isLongBreak = sessionCount % longBreakInterval === 0;
        
        if (isLongBreak) {
            breakSeconds *= 1.5; // 50% longer break
            vscode.window.showInformationMessage('🐕 Time for a LONG break!');
        }
        config.get('enableHardcoreMode') 
            ? activateHardcoreMode(context, gameState, breakSeconds)
            : showRegularBreak(breakSeconds);
    }

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('pupguardian.openSettings', () => {
            SettingsPanel.createOrShow(context);
        }),
		puppy,
		new vscode.Disposable(() => clearInterval(workInterval))
    );

    startTimer();
}

function showRegularBreak(breakSeconds: number) {
    vscode.window.showInformationMessage(
        `🐶 Time for a ${breakSeconds} second break! Look away!`,
        'Start Break'
    ).then(selection => {
        if (selection) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Eye Break",
                cancellable: false
            }, (progress) => {
                return new Promise(resolve => {
                    let secondsLeft = breakSeconds;
                    const interval = setInterval(() => {
                        secondsLeft--;
                        progress.report({
                            message: `${secondsLeft}s remaining`
                        });
                        if (secondsLeft <= 0) {
                            clearInterval(interval);
                            resolve(null);
                        }
                    }, 1000);
                });
            });
        }
    });
}

export function deactivate() {
    clearInterval(workInterval);
}