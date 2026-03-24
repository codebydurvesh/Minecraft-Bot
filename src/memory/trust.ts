import * as fs   from 'fs';
import * as path from 'path';

export interface PlayerProfile {
  username: string; trustScore: number; interactions: string[];
  lastSeen: number; gaveMeItems: string[]; attackedMe: boolean; chatCount: number;
}

export class TrustMemory {
  players: Record<string, PlayerProfile> = {};
  private file: string;

  constructor(dataDir = './data') {
    this.file = path.join(dataDir, 'trust.json');
    fs.mkdirSync(dataDir, { recursive: true });
    this.load();
  }

  private load() {
    try { if (fs.existsSync(this.file)) this.players = JSON.parse(fs.readFileSync(this.file, 'utf-8')); }
    catch { this.players = {}; }
  }

  private save() {
    try { fs.writeFileSync(this.file, JSON.stringify(this.players, null, 2)); } catch {}
  }

  get(username: string): PlayerProfile {
    if (!this.players[username]) {
      this.players[username] = {
        username,
        // FIX: was 0.5 — isTrusted() requires >0.65, so new players could never
        // trigger follow or trusted actions on first interaction.
        // 0.7 = friendly by default; attacking drops to <0.25 (threat) in one hit.
        trustScore: 0.7,
        interactions: [],
        lastSeen: Date.now(),
        gaveMeItems: [],
        attackedMe: false,
        chatCount: 0,
      };
    }
    return this.players[username];
  }

  private log(username: string, event: string) {
    const p = this.get(username);
    p.interactions.push(`${new Date().toISOString().slice(11, 19)}: ${event}`);
    if (p.interactions.length > 30) p.interactions = p.interactions.slice(-30);
    p.lastSeen = Date.now();
    this.save();
  }

  onAttacked(u: string)               { const p = this.get(u); p.trustScore = Math.max(0, p.trustScore - 0.4); p.attackedMe = true; this.log(u, 'attacked me'); }
  onGaveItem(u: string, item: string) { const p = this.get(u); p.trustScore = Math.min(1, p.trustScore + 0.15); p.gaveMeItems.push(item); this.log(u, `gave ${item}`); }
  onChat(u: string, msg: string)      { const p = this.get(u); p.trustScore = Math.min(1, p.trustScore + 0.01); p.chatCount++; this.log(u, `said: ${msg.slice(0, 30)}`); }

  // Trusted = not a griefer (> 0.65 means never attacked me)
  isTrusted(u: string)  { return this.get(u).trustScore > 0.65; }
  // Threat  = actively hostile (< 0.25, i.e. attacked at least once)
  isThreat(u: string)   { return this.get(u).trustScore < 0.25; }
  threats(): string     { return Object.values(this.players).filter(p => p.trustScore < 0.25).map(p => p.username).join(',') || 'none'; }
}