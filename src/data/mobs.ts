import { Bot }    from 'mineflayer';
import { Entity } from 'prismarine-entity';

// ─── Mob info table ────────────────────────────────────────────────────────

export interface MobInfo {
  name:            string;
  threat:          'passive' | 'neutral' | 'hostile' | 'boss';
  fleeDistance:    number;   // start fleeing when closer than this (m)
  attackDistance:  number;   // mob can hit you from this far (m)
  drops:           string[]; // common item drops
}

export const MOBS: Record<string, MobInfo> = {
  // ── Hostile ──────────────────────────────────────────────────────────────
  zombie:          { name: 'zombie',          threat: 'hostile', fleeDistance: 16, attackDistance: 3,  drops: ['rotten_flesh'] },
  skeleton:        { name: 'skeleton',        threat: 'hostile', fleeDistance: 20, attackDistance: 16, drops: ['bone','arrow'] },
  creeper:         { name: 'creeper',         threat: 'hostile', fleeDistance: 20, attackDistance: 4,  drops: ['gunpowder'] },
  spider:          { name: 'spider',          threat: 'hostile', fleeDistance: 12, attackDistance: 2,  drops: ['string','spider_eye'] },
  cave_spider:     { name: 'cave_spider',     threat: 'hostile', fleeDistance: 12, attackDistance: 2,  drops: ['string','spider_eye'] },
  witch:           { name: 'witch',           threat: 'hostile', fleeDistance: 16, attackDistance: 10, drops: ['glass_bottle','gunpowder','redstone'] },
  pillager:        { name: 'pillager',        threat: 'hostile', fleeDistance: 24, attackDistance: 16, drops: ['arrow'] },
  vindicator:      { name: 'vindicator',      threat: 'hostile', fleeDistance: 16, attackDistance: 3,  drops: ['emerald'] },
  ravager:         { name: 'ravager',         threat: 'hostile', fleeDistance: 32, attackDistance: 4,  drops: ['saddle'] },
  blaze:           { name: 'blaze',           threat: 'hostile', fleeDistance: 20, attackDistance: 8,  drops: ['blaze_rod'] },
  ghast:           { name: 'ghast',           threat: 'hostile', fleeDistance: 32, attackDistance: 16, drops: ['ghast_tear','gunpowder'] },
  magma_cube:      { name: 'magma_cube',      threat: 'hostile', fleeDistance: 8,  attackDistance: 2,  drops: ['magma_cream'] },
  wither_skeleton: { name: 'wither_skeleton', threat: 'hostile', fleeDistance: 20, attackDistance: 3,  drops: ['coal','bone'] },
  zombie_villager: { name: 'zombie_villager', threat: 'hostile', fleeDistance: 16, attackDistance: 3,  drops: ['rotten_flesh'] },
  drowned:         { name: 'drowned',         threat: 'hostile', fleeDistance: 16, attackDistance: 3,  drops: ['rotten_flesh'] },
  husk:            { name: 'husk',            threat: 'hostile', fleeDistance: 16, attackDistance: 3,  drops: ['rotten_flesh'] },
  stray:           { name: 'stray',           threat: 'hostile', fleeDistance: 20, attackDistance: 16, drops: ['bone','arrow'] },
  phantom:         { name: 'phantom',         threat: 'hostile', fleeDistance: 20, attackDistance: 3,  drops: ['phantom_membrane'] },
  slime:           { name: 'slime',           threat: 'hostile', fleeDistance: 8,  attackDistance: 2,  drops: ['slime_ball'] },

  // ── Neutral ───────────────────────────────────────────────────────────────
  enderman:        { name: 'enderman',        threat: 'neutral', fleeDistance: 0,  attackDistance: 2,  drops: ['ender_pearl'] },
  wolf:            { name: 'wolf',            threat: 'neutral', fleeDistance: 0,  attackDistance: 2,  drops: [] },
  bee:             { name: 'bee',             threat: 'neutral', fleeDistance: 0,  attackDistance: 2,  drops: [] },

  // ── Passive ───────────────────────────────────────────────────────────────
  cow:             { name: 'cow',             threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['beef','leather'] },
  sheep:           { name: 'sheep',           threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['mutton','white_wool'] },
  chicken:         { name: 'chicken',         threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['chicken','feather'] },
  pig:             { name: 'pig',             threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['porkchop'] },
  villager:        { name: 'villager',        threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: [] },
  horse:           { name: 'horse',           threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['leather'] },
  rabbit:          { name: 'rabbit',          threat: 'passive', fleeDistance: 0,  attackDistance: 0,  drops: ['rabbit','rabbit_hide'] },
};

// ─── Derived lists ─────────────────────────────────────────────────────────

export const HOSTILE_NAMES  = Object.values(MOBS).filter(m => m.threat === 'hostile').map(m => m.name);
export const PASSIVE_NAMES  = Object.values(MOBS).filter(m => m.threat === 'passive').map(m => m.name);
export const NEUTRAL_NAMES  = Object.values(MOBS).filter(m => m.threat === 'neutral').map(m => m.name);
export const FOOD_MOB_NAMES = ['cow', 'sheep', 'chicken', 'pig'];

// ─── Entity finders ────────────────────────────────────────────────────────

/**
 * Returns the NEAREST hostile entity within maxDist metres.
 *
 * FIX: was using Array.find() which returned the first match in JS object
 * iteration order (not sorted by distance). Now correctly returns the nearest.
 */
export function getNearestHostile(bot: Bot, maxDist = 24): Entity | null {
  let best: Entity | null = null;
  let bestDist = maxDist;

  for (const e of Object.values(bot.entities) as Entity[]) {
    if (!HOSTILE_NAMES.includes((e as any).name ?? '')) continue;
    if (!e.position) continue;
    const d = e.position.distanceTo(bot.entity.position);
    if (d < bestDist) { best = e; bestDist = d; }
  }
  return best;
}

/**
 * Returns the nearest passive entity whose name is in the provided list,
 * within maxDist metres.
 */
export function getNearestPassive(bot: Bot, names: string[], maxDist = 64): Entity | null {
  let best: Entity | null = null;
  let bestDist = maxDist;

  for (const e of Object.values(bot.entities) as Entity[]) {
    if (!names.includes((e as any).name ?? '')) continue;
    if (!e.position) continue;
    const d = e.position.distanceTo(bot.entity.position);
    if (d < bestDist) { best = e; bestDist = d; }
  }
  return best;
}

/**
 * Returns all hostile entities within maxDist, sorted nearest-first.
 * Useful for flee vector calculation (needs all threats, not just one).
 */
export function getAllHostiles(bot: Bot, maxDist = 24): Entity[] {
  return (Object.values(bot.entities) as Entity[])
    .filter(e => HOSTILE_NAMES.includes((e as any).name ?? '') && e.position &&
                 e.position.distanceTo(bot.entity.position) < maxDist)
    .sort((a, b) =>
      a.position!.distanceTo(bot.entity.position) -
      b.position!.distanceTo(bot.entity.position)
    );
}

/**
 * Returns the fleeDistance for a mob by name (0 if unknown).
 */
export function getFleeDistance(mobName: string): number {
  return MOBS[mobName]?.fleeDistance ?? 16;
}

/**
 * Returns the typical drops for a mob by name.
 */
export function getMobDrops(mobName: string): string[] {
  return MOBS[mobName]?.drops ?? [];
}