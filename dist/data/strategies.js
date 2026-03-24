"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRATEGIES = void 0;
exports.getPhase = getPhase;
exports.getPickaxeTier = getPickaxeTier;
exports.getSwordTier = getSwordTier;
// ─── Strategy sequences ────────────────────────────────────────────────────
// Each array is an ORDERED list of goals the bot works through per phase.
// Brain.pickGoal() shifts items off the queue; when drained, Brain rebuilds
// it from goals not yet achieved (see Bug #7 fix).
exports.STRATEGIES = {
    early_game: [
        { goal: 'gather', target: 'wood', reason: 'need logs' },
        { goal: 'craft', target: 'crafting_table', reason: 'need crafting table' },
        { goal: 'craft', target: 'wooden_pickaxe', reason: 'need pickaxe' },
        { goal: 'craft', target: 'wooden_axe', reason: 'need axe' },
        { goal: 'craft', target: 'wooden_sword', reason: 'need sword' },
        { goal: 'gather', target: 'stone', reason: 'upgrade tools' },
        { goal: 'craft', target: 'stone_pickaxe', reason: 'better pickaxe' },
        { goal: 'craft', target: 'stone_sword', reason: 'better sword' },
        { goal: 'gather', target: 'coal', reason: 'need torches/fuel' },
        { goal: 'craft', target: 'furnace', reason: 'need smelting' },
        { goal: 'gather', target: 'iron', reason: 'iron age' },
    ],
    mid_game: [
        { goal: 'smelt', target: 'iron_ingot', reason: 'smelt iron ore' },
        { goal: 'craft', target: 'iron_pickaxe', reason: 'iron tools' },
        { goal: 'craft', target: 'iron_sword', reason: 'iron sword' },
        { goal: 'craft', target: 'iron_axe', reason: 'iron axe' },
        { goal: 'craft', target: 'iron_helmet', reason: 'armor' },
        { goal: 'craft', target: 'iron_chestplate', reason: 'armor' },
        { goal: 'craft', target: 'iron_leggings', reason: 'armor' },
        { goal: 'craft', target: 'iron_boots', reason: 'armor' },
        { goal: 'gather', target: 'diamond', reason: 'end game gear' },
    ],
    late_game: [
        { goal: 'explore', target: 'any', reason: 'late game exploration' },
        { goal: 'explore', target: 'village', reason: 'find village trades' },
        { goal: 'gather', target: 'diamond', reason: 'max out gear' },
    ],
    // Emergency food path — only activated by Brain when food is critically low
    starving: [
        { goal: 'survive', target: 'eat', reason: 'critical hunger' },
        { goal: 'hunt', target: 'cow', reason: 'need food fast' },
        { goal: 'hunt', target: 'chicken', reason: 'any food' },
        { goal: 'hunt', target: 'pig', reason: 'any food' },
        { goal: 'gather', target: 'food', reason: 'harvest crops' },
    ],
};
/**
 * Determines the bot's current game phase from its inventory.
 *
 * FIX (Bug #10): Previous version matched any item containing 'iron_' which
 * triggered mid_game on raw_iron or iron_ingot from zombie drops — too early.
 * Now gates on actual iron/diamond TOOLS, which represent real progression.
 */
function getPhase(bot) {
    const itemNames = bot.inventory.items().map((i) => i.name);
    const IRON_TOOLS = [
        'iron_pickaxe', 'iron_sword', 'iron_axe', 'iron_shovel',
        'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
    ];
    const DIAMOND_TOOLS = [
        'diamond_pickaxe', 'diamond_sword', 'diamond_axe', 'diamond_shovel',
        'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots',
        'netherite_pickaxe', 'netherite_sword', 'netherite_axe',
    ];
    if (itemNames.some(n => DIAMOND_TOOLS.includes(n)))
        return 'late_game';
    if (itemNames.some(n => IRON_TOOLS.includes(n)))
        return 'mid_game';
    return 'early_game';
}
// ─── Pickaxe tier helper ───────────────────────────────────────────────────
/**
 * Returns the numeric tier of the best pickaxe in the bot's inventory.
 *   -1 = no pickaxe
 *    0 = wooden / golden
 *    1 = stone
 *    2 = iron
 *    3 = diamond / netherite
 */
function getPickaxeTier(bot) {
    const names = bot.inventory.items().map((i) => i.name);
    if (names.some(n => n === 'netherite_pickaxe' || n === 'diamond_pickaxe'))
        return 3;
    if (names.some(n => n === 'iron_pickaxe'))
        return 2;
    if (names.some(n => n === 'stone_pickaxe'))
        return 1;
    if (names.some(n => n === 'wooden_pickaxe' || n === 'golden_pickaxe'))
        return 0;
    return -1;
}
/**
 * Returns the numeric tier of the best sword in the bot's inventory.
 *   -1 = no sword
 */
function getSwordTier(bot) {
    const names = bot.inventory.items().map((i) => i.name);
    if (names.some(n => n === 'netherite_sword' || n === 'diamond_sword'))
        return 3;
    if (names.some(n => n === 'iron_sword'))
        return 2;
    if (names.some(n => n === 'stone_sword'))
        return 1;
    if (names.some(n => n === 'wooden_sword' || n === 'golden_sword'))
        return 0;
    return -1;
}
