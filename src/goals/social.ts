import { Bot } from 'mineflayer';
import { TrustMemory } from '../memory/trust';
import { navigateTo } from '../utils/navigation';
import { log } from '../utils/logger';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const GREETINGS = ['Hello!', 'Hey!', 'Hi there!', 'Howdy!', "What's up!"];

export async function executeSocial(
  bot: Bot,
  target: string,
  trust: TrustMemory,
): Promise<{ success: boolean; reason: string }> {
  const { goals } = require('mineflayer-pathfinder');

  // All online players except the bot itself, with a valid entity
  const players = Object.values(bot.players).filter(
    p => p.username !== bot.username && p.entity,
  );

  // ─── Greet ───────────────────────────────────────────────────────────────
  if (target === 'greet') {
    if (!players.length) return { success: false, reason: 'no players online' };
    bot.chat(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    for (const p of players) trust.onChat(p.username, 'greeted');
    return { success: true, reason: `greeted ${players.length} player(s)` };
  }

  // ─── Flee threat ─────────────────────────────────────────────────────────
  if (target === 'flee_threat') {
    const threats = players.filter(p => trust.isThreat(p.username) && p.entity);
    for (const t of threats) {
      if (t.entity!.position.distanceTo(bot.entity.position) < 20) {
        bot.chat('Stay away from me!');
        const away = bot.entity.position
          .minus(t.entity!.position)
          .normalize()
          .scale(20);
        const dest = bot.entity.position.plus(away);
        bot.pathfinder.setGoal(new goals.GoalXZ(dest.x, dest.z));
        await sleep(5000);
        bot.pathfinder.setGoal(null);
        return { success: true, reason: `fled from threat ${t.username}` };
      }
    }
    return { success: true, reason: 'no nearby threats' };
  }

  // ─── Follow ───────────────────────────────────────────────────────────────
  // FIX: "follow_trusted" now follows ANY non-threat player, not just trust>0.65.
  // The goal was explicitly queued by a player chat command, so requiring
  // trust>0.65 (which new players never have at 0.5 default) silently broke it.
  if (target === 'follow_trusted' || target === 'follow') {
    if (!players.length) return { success: false, reason: 'no players online' };

    // Pick nearest non-threat, fall back to nearest player if none qualify
    const sorted = [...players].sort((a, b) =>
      a.entity!.position.distanceTo(bot.entity.position) -
      b.entity!.position.distanceTo(bot.entity.position),
    );
    const chosen =
      sorted.find(p => !trust.isThreat(p.username)) ?? sorted[0];

    if (!chosen?.entity) return { success: false, reason: 'no valid follow target' };

    bot.chat(`Following you, ${chosen.username}! 🏃`);
    log.brain(`[social] Following ${chosen.username}`);

    // FIX: GoalFollow with dynamic=true so bot keeps re-pathing as player moves.
    // FIX: follow duration raised from 12 s → 30 s so it actually follows.
    bot.pathfinder.setGoal(new goals.GoalFollow(chosen.entity, 3), true);

    const FOLLOW_MS = 30_000;
    const start = Date.now();
    while (Date.now() - start < FOLLOW_MS) {
      await sleep(500);
      // Stop if player disconnected
      if (!bot.players[chosen.username]?.entity) {
        log.brain(`[social] ${chosen.username} left, stopping follow`);
        break;
      }
      // Re-acquire entity reference (it can change between ticks)
      const freshEntity = bot.players[chosen.username]?.entity;
      if (freshEntity) {
        try {
          bot.pathfinder.setGoal(new goals.GoalFollow(freshEntity, 3), true);
        } catch {}
      }
    }

    bot.pathfinder.setGoal(null);
    bot.chat(`Done following ${chosen.username}.`);
    return { success: true, reason: `followed ${chosen.username} for ${FOLLOW_MS / 1000}s` };
  }

  // ─── Follow a specific named player ──────────────────────────────────────
  // Handles targets like "follow:Steve" injected by the keyword parser
  if (target.startsWith('follow:')) {
    const name = target.slice(7);
    const p = bot.players[name];
    if (!p?.entity) return { success: false, reason: `${name} not found` };

    bot.chat(`On my way to ${name}!`);
    bot.pathfinder.setGoal(new goals.GoalFollow(p.entity, 3), true);
    await sleep(20_000);
    bot.pathfinder.setGoal(null);
    return { success: true, reason: `followed ${name}` };
  }

  return { success: false, reason: `unknown social target: ${target}` };
}