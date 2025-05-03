export const PUPPY_SPRITES = {
    default: '(°ᴥ°)ﾉ',
    looking: '(◕ᴥ◕)',
    warning: '(✧ᴥ✧)',
    eating: '(╹ᴥ╹)🍖',
    sleeping: '(∪｡∪)｡｡｡zzz',
    withSunglasses: '(⌐■_■)ﾉ',
    withBandana: '(°ᴥ°)~☆',
    excited: 'ヾ(°∇°*)'
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