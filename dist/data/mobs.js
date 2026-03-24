"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOOD_MOB_NAMES = exports.NEUTRAL_NAMES = exports.PASSIVE_NAMES = exports.HOSTILE_NAMES = exports.MOBS = void 0;
exports.getNearestHostile = getNearestHostile;
exports.getNearestPassive = getNearestPassive;
exports.getAllHostiles = getAllHostiles;
exports.getFleeDistance = getFleeDistance;
exports.getMobDrops = getMobDrops;
exports.MOBS = {
    // ── Hostile ──────────────────────────────────────────────────────────────
    zombie: { name: 'zombie', threat: 'hostile', fleeDistance: 16, attackDistance: 3, drops: ['rotten_flesh'] },
    skeleton: { name: 'skeleton', threat: 'hostile', fleeDistance: 20, attackDistance: 16, drops: ['bone', 'arrow'] },
    creeper: { name: 'creeper', threat: 'hostile', fleeDistance: 20, attackDistance: 4, drops: ['gunpowder'] },
    spider: { name: 'spider', threat: 'hostile', fleeDistance: 12, attackDistance: 2, drops: ['string', 'spider_eye'] },
    cave_spider: { name: 'cave_spider', threat: 'hostile', fleeDistance: 12, attackDistance: 2, drops: ['string', 'spider_eye'] },
    witch: { name: 'witch', threat: 'hostile', fleeDistance: 16, attackDistance: 10, drops: ['glass_bottle', 'gunpowder', 'redstone'] },
    pillager: { name: 'pillager', threat: 'hostile', fleeDistance: 24, attackDistance: 16, drops: ['arrow'] },
    vindicator: { name: 'vindicator', threat: 'hostile', fleeDistance: 16, attackDistance: 3, drops: ['emerald'] },
    ravager: { name: 'ravager', threat: 'hostile', fleeDistance: 32, attackDistance: 4, drops: ['saddle'] },
    blaze: { name: 'blaze', threat: 'hostile', fleeDistance: 20, attackDistance: 8, drops: ['blaze_rod'] },
    ghast: { name: 'ghast', threat: 'hostile', fleeDistance: 32, attackDistance: 16, drops: ['ghast_tear', 'gunpowder'] },
    magma_cube: { name: 'magma_cube', threat: 'hostile', fleeDistance: 8, attackDistance: 2, drops: ['magma_cream'] },
    wither_skeleton: { name: 'wither_skeleton', threat: 'hostile', fleeDistance: 20, attackDistance: 3, drops: ['coal', 'bone'] },
    zombie_villager: { name: 'zombie_villager', threat: 'hostile', fleeDistance: 16, attackDistance: 3, drops: ['rotten_flesh'] },
    drowned: { name: 'drowned', threat: 'hostile', fleeDistance: 16, attackDistance: 3, drops: ['rotten_flesh'] },
    husk: { name: 'husk', threat: 'hostile', fleeDistance: 16, attackDistance: 3, drops: ['rotten_flesh'] },
    stray: { name: 'stray', threat: 'hostile', fleeDistance: 20, attackDistance: 16, drops: ['bone', 'arrow'] },
    phantom: { name: 'phantom', threat: 'hostile', fleeDistance: 20, attackDistance: 3, drops: ['phantom_membrane'] },
    slime: { name: 'slime', threat: 'hostile', fleeDistance: 8, attackDistance: 2, drops: ['slime_ball'] },
    // ── Neutral ───────────────────────────────────────────────────────────────
    enderman: { name: 'enderman', threat: 'neutral', fleeDistance: 0, attackDistance: 2, drops: ['ender_pearl'] },
    wolf: { name: 'wolf', threat: 'neutral', fleeDistance: 0, attackDistance: 2, drops: [] },
    bee: { name: 'bee', threat: 'neutral', fleeDistance: 0, attackDistance: 2, drops: [] },
    // ── Passive ───────────────────────────────────────────────────────────────
    cow: { name: 'cow', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['beef', 'leather'] },
    sheep: { name: 'sheep', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['mutton', 'white_wool'] },
    chicken: { name: 'chicken', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['chicken', 'feather'] },
    pig: { name: 'pig', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['porkchop'] },
    villager: { name: 'villager', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: [] },
    horse: { name: 'horse', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['leather'] },
    rabbit: { name: 'rabbit', threat: 'passive', fleeDistance: 0, attackDistance: 0, drops: ['rabbit', 'rabbit_hide'] },
};
// ─── Derived lists ─────────────────────────────────────────────────────────
exports.HOSTILE_NAMES = Object.values(exports.MOBS).filter(m => m.threat === 'hostile').map(m => m.name);
exports.PASSIVE_NAMES = Object.values(exports.MOBS).filter(m => m.threat === 'passive').map(m => m.name);
exports.NEUTRAL_NAMES = Object.values(exports.MOBS).filter(m => m.threat === 'neutral').map(m => m.name);
exports.FOOD_MOB_NAMES = ['cow', 'sheep', 'chicken', 'pig'];
// ─── Entity finders ────────────────────────────────────────────────────────
/**
 * Returns the NEAREST hostile entity within maxDist metres.
 *
 * FIX: was using Array.find() which returned the first match in JS object
 * iteration order (not sorted by distance). Now correctly returns the nearest.
 */
function getNearestHostile(bot, maxDist = 24) {
    let best = null;
    let bestDist = maxDist;
    for (const e of Object.values(bot.entities)) {
        if (!exports.HOSTILE_NAMES.includes(e.name ?? ''))
            continue;
        if (!e.position)
            continue;
        const d = e.position.distanceTo(bot.entity.position);
        if (d < bestDist) {
            best = e;
            bestDist = d;
        }
    }
    return best;
}
/**
 * Returns the nearest passive entity whose name is in the provided list,
 * within maxDist metres.
 */
function getNearestPassive(bot, names, maxDist = 64) {
    let best = null;
    let bestDist = maxDist;
    for (const e of Object.values(bot.entities)) {
        if (!names.includes(e.name ?? ''))
            continue;
        if (!e.position)
            continue;
        const d = e.position.distanceTo(bot.entity.position);
        if (d < bestDist) {
            best = e;
            bestDist = d;
        }
    }
    return best;
}
/**
 * Returns all hostile entities within maxDist, sorted nearest-first.
 * Useful for flee vector calculation (needs all threats, not just one).
 */
function getAllHostiles(bot, maxDist = 24) {
    return Object.values(bot.entities)
        .filter(e => exports.HOSTILE_NAMES.includes(e.name ?? '') && e.position &&
        e.position.distanceTo(bot.entity.position) < maxDist)
        .sort((a, b) => a.position.distanceTo(bot.entity.position) -
        b.position.distanceTo(bot.entity.position));
}
/**
 * Returns the fleeDistance for a mob by name (0 if unknown).
 */
function getFleeDistance(mobName) {
    return exports.MOBS[mobName]?.fleeDistance ?? 16;
}
/**
 * Returns the typical drops for a mob by name.
 */
function getMobDrops(mobName) {
    return exports.MOBS[mobName]?.drops ?? [];
}
