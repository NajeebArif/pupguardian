import * as vscode from 'vscode';

export const PUPPY_SPRITES = {
    default: '(°ᴥ°)ﾉ',
    withSunglasses: '(⌐■_■)ﾉ',
    withBandana: '(°ᴥ°)︻╦̵̵̿╤──',
    eating: '(╹ᴥ╹)🍖',
    sleeping: '(∪｡∪)｡｡｡zzz'
};

export function getPuppySprite(state: { accessories: string[] }): string {
    if (state.accessories.includes('sunglasses')) {
        return PUPPY_SPRITES.withSunglasses;
    }
    if (state.accessories.includes('bandana')) {
        return PUPPY_SPRITES.withBandana;
    }
    return PUPPY_SPRITES.default;
}

export function getSpriteUri(context: vscode.ExtensionContext, spriteName: string): vscode.Uri {
    return vscode.Uri.joinPath(context.extensionUri, 'assets', 'sprites', `${spriteName}.png`);
}