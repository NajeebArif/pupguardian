import * as vscode from 'vscode';
import { getPuppySprite } from './assets/sprites';

export interface GameState {
    workMinutes: number;
    xp: number;
    level: number;
    accessories: string[];
    addXP: (points: number) => void;
    getCurrentSprite: () => string;
}

export function setupGamification(context: vscode.ExtensionContext): GameState {
    const storedState = context.globalState.get<Partial<GameState>>('gameState') || {};
    
    const state: GameState = {
        workMinutes: 0,
        xp: storedState.xp || 0,
        level: storedState.level || 1,
        accessories: storedState.accessories || ['bandana'],
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
            context.globalState.update('gameState', this);
        },
        getCurrentSprite() { // Fixed: Proper method syntax binds 'this'
            return getPuppySprite({
                accessories: this.accessories
            });
        }
    };

    return state;
}