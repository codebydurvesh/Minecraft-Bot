"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcData = getMcData;
exports.hasItem = hasItem;
exports.hasAny = hasAny;
exports.countItem = countItem;
exports.getBestFood = getBestFood;
exports.getBestTool = getBestTool;
exports.getBestPickaxeTier = getBestPickaxeTier;
exports.getBestSwordTier = getBestSwordTier;
exports.canMineBlock = canMineBlock;
exports.canHarvestBlock = canHarvestBlock;
exports.getBestArmorUpgrades = getBestArmorUpgrades;
// ─── minecraft-data cache ──────────────────────────────────────────────────
// Cache per-version so we never call require('minecraft-data')(version) more
// than once — it's expensive and was previously done on every goal call.
const _mcDataCache = {};
function getMcData(version) {
    if (!_mcDataCache[version]) {
        _mcDataCache[version] = require('minecraft-data')(version);
    }
    return _mcDataCache[version];
}
// ─── Basic inventory helpers ───────────────────────────────────────────────
/** True if the bot has at least 1 of this item by name. */
function hasItem(bot, name) {
    return bot.inventory.items().some(i => i.name === name);
}
/** True if the bot has at least 1 of any of the listed item names. */
function hasAny(bot, names) {
    return bot.inventory.items().some(i => names.includes(i.name));
}
/** Total count of an item across all inventory slots. */
function countItem(bot, name) {
    return bot.inventory.items()
        .filter(i => i.name === name)
        .reduce((sum, i) => sum + i.count, 0);
}
// ─── Food selection (minecraft-data driven) ────────────────────────────────
/**
 * Returns the best food item the bot currently has in inventory.
 * "Best" = highest saturation value per the MC data for this version.
 * Automatically works for any MC version — no hardcoded food list.
 */
function getBestFood(bot) {
    const mcData = getMcData(bot.version);
    // mcData.foods is a Record<id, {id, name, stackSize, saturation, foodPoints}>
    const foods = Object.values(mcData.foods)
        .sort((a, b) => b.saturation - a.saturation);
    for (const food of foods) {
        // findInventoryItem(id, metadata, notFull)
        const item = bot.inventory.findInventoryItem(food.id, null, false);
        if (item)
            return item;
    }
    return null;
}
// ─── Tool selection ─────────────────────────────────────────────────────────
// Tier order used for comparison — lower index = worse tool.
// We check highest tier first so getBestTool always returns the best available.
const PICKAXE_TIERS = [
    'netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe',
    'stone_pickaxe', 'wooden_pickaxe', 'golden_pickaxe',
];
const AXE_TIERS = [
    'netherite_axe', 'diamond_axe', 'iron_axe',
    'stone_axe', 'wooden_axe', 'golden_axe',
];
const SHOVEL_TIERS = [
    'netherite_shovel', 'diamond_shovel', 'iron_shovel',
    'stone_shovel', 'wooden_shovel', 'golden_shovel',
];
const SWORD_TIERS = [
    'netherite_sword', 'diamond_sword', 'iron_sword',
    'stone_sword', 'wooden_sword', 'golden_sword',
];
const HOE_TIERS = [
    'netherite_hoe', 'diamond_hoe', 'iron_hoe',
    'stone_hoe', 'wooden_hoe', 'golden_hoe',
];
const TOOL_LIST = {
    pickaxe: PICKAXE_TIERS,
    axe: AXE_TIERS,
    shovel: SHOVEL_TIERS,
    sword: SWORD_TIERS,
    hoe: HOE_TIERS,
};
/**
 * Returns the best tool of the given type from the bot's inventory.
 * Type should be 'pickaxe', 'axe', 'shovel', 'sword', or 'hoe'.
 * Returns null if none found.
 */
function getBestTool(bot, type) {
    const tiers = TOOL_LIST[type];
    if (!tiers)
        return null;
    for (const toolName of tiers) {
        const item = bot.inventory.items().find(i => i.name === toolName);
        if (item)
            return item;
    }
    return null;
}
/**
 * Returns the numeric tier (0=wooden, 1=stone, 2=iron, 3=diamond/netherite)
 * of the best pickaxe in the bot's inventory. Returns -1 if no pickaxe.
 */
function getBestPickaxeTier(bot) {
    const inv = bot.inventory.items().map(i => i.name);
    if (inv.some(n => n === 'netherite_pickaxe' || n === 'diamond_pickaxe'))
        return 3;
    if (inv.some(n => n === 'iron_pickaxe'))
        return 2;
    if (inv.some(n => n === 'stone_pickaxe'))
        return 1;
    if (inv.some(n => n === 'wooden_pickaxe' || n === 'golden_pickaxe'))
        return 0;
    return -1;
}
/**
 * Returns the numeric tier of the best sword in inventory.
 * -1 = no sword.
 */
function getBestSwordTier(bot) {
    const inv = bot.inventory.items().map(i => i.name);
    if (inv.some(n => n === 'netherite_sword' || n === 'diamond_sword'))
        return 3;
    if (inv.some(n => n === 'iron_sword'))
        return 2;
    if (inv.some(n => n === 'stone_sword'))
        return 1;
    if (inv.some(n => n === 'wooden_sword' || n === 'golden_sword'))
        return 0;
    return -1;
}
// ─── Block-mining capability (minecraft-data driven) ──────────────────────
/**
 * Returns true if the bot currently holds a tool that can harvest the given
 * block (i.e. the block will drop items). Uses minecraft-data harvestTools,
 * which is authoritative for any MC version.
 *
 * If the block has no harvestTools requirement, any tool (or bare hands) works.
 */
function canMineBlock(bot, blockName) {
    const mcData = getMcData(bot.version);
    const block = mcData.blocksByName[blockName];
    if (!block)
        return false; // unknown block
    if (!block.harvestTools)
        return true; // no tool required — hands are fine
    // harvestTools is { "<itemId>": true, ... }
    const validToolIds = new Set(Object.keys(block.harvestTools).map(Number));
    return bot.inventory.items().some(item => validToolIds.has(item.type));
}
/**
 * Returns true if the bot holds a tool that can harvest the block AND the
 * item drop requires that specific tool (silk-touch / fortune aside).
 * Useful for deciding whether to bother navigating to an ore.
 */
function canHarvestBlock(bot, blockName) {
    return canMineBlock(bot, blockName);
}
// ─── Armor helpers ─────────────────────────────────────────────────────────
const ARMOR_TIERS = {
    // slot 5 = head
    5: ['netherite_helmet', 'diamond_helmet', 'iron_helmet', 'golden_helmet', 'chainmail_helmet', 'leather_helmet'],
    // slot 6 = chest
    6: ['netherite_chestplate', 'diamond_chestplate', 'iron_chestplate', 'golden_chestplate', 'chainmail_chestplate', 'leather_chestplate'],
    // slot 7 = legs
    7: ['netherite_leggings', 'diamond_leggings', 'iron_leggings', 'golden_leggings', 'chainmail_leggings', 'leather_leggings'],
    // slot 8 = feet
    8: ['netherite_boots', 'diamond_boots', 'iron_boots', 'golden_boots', 'chainmail_boots', 'leather_boots'],
};
/**
 * For each armor slot (5–8), returns the best armor piece in inventory
 * that is not yet equipped (or is better than what's equipped).
 * Returns an array of { slot, item } pairs ready to equip.
 */
function getBestArmorUpgrades(bot) {
    const upgrades = [];
    for (const [slotStr, tiers] of Object.entries(ARMOR_TIERS)) {
        const slot = Number(slotStr);
        const current = bot.inventory.slots[slot];
        const curTier = current ? tiers.indexOf(current.name) : tiers.length; // lower index = better
        for (let t = 0; t < tiers.length; t++) {
            const candidate = bot.inventory.items().find(i => i.name === tiers[t]);
            if (candidate && t < curTier) {
                upgrades.push({ slot, item: candidate });
                break; // best available for this slot
            }
        }
    }
    return upgrades;
}
