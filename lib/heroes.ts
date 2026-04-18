export type Hero = {
  id: string;
  name: string;
  attribute: "str" | "agi" | "int" | "uni";
  roles: string[];
  counters: string[];
  emoji: string;
};

export const HEROES: Hero[] = [
  { id: "antimage", name: "Anti-Mage", attribute: "agi", roles: ["Carry", "Escape"], counters: ["Storm Spirit", "Medusa"], emoji: "⚡" },
  { id: "axe", name: "Axe", attribute: "str", roles: ["Initiator", "Durable"], counters: ["Lifestealer", "Wraith King"], emoji: "🪓" },
  { id: "crystal_maiden", name: "Crystal Maiden", attribute: "int", roles: ["Support", "Disabler"], counters: ["Bristleback"], emoji: "❄️" },
  { id: "drow_ranger", name: "Drow Ranger", attribute: "agi", roles: ["Carry", "Disabler"], counters: ["Phantom Assassin"], emoji: "🏹" },
  { id: "earthshaker", name: "Earthshaker", attribute: "str", roles: ["Initiator", "Disabler"], counters: ["Grouped heroes"], emoji: "🌍" },
  { id: "invoker", name: "Invoker", attribute: "int", roles: ["Carry", "Nuker"], counters: ["Medusa", "Supports"], emoji: "🌀" },
  { id: "juggernaut", name: "Juggernaut", attribute: "agi", roles: ["Carry", "Pusher"], counters: ["High armor heroes"], emoji: "🗡️" },
  { id: "lina", name: "Lina", attribute: "int", roles: ["Carry", "Support", "Nuker"], counters: ["Axe"], emoji: "🔥" },
  { id: "lion", name: "Lion", attribute: "int", roles: ["Support", "Disabler"], counters: ["Meepo"], emoji: "🦁" },
  { id: "pudge", name: "Pudge", attribute: "str", roles: ["Disabler", "Initiator"], counters: ["Fragile supports"], emoji: "🪝" },
  { id: "rubick", name: "Rubick", attribute: "int", roles: ["Support", "Disabler"], counters: ["Strong spell heroes"], emoji: "🔮" },
  { id: "shadow_fiend", name: "Shadow Fiend", attribute: "agi", roles: ["Carry", "Nuker"], counters: ["Slow supports"], emoji: "💀" },
  { id: "storm_spirit", name: "Storm Spirit", attribute: "int", roles: ["Carry", "Escape", "Nuker"], counters: ["Mana-dependent"], emoji: "⚡" },
  { id: "tidehunter", name: "Tidehunter", attribute: "str", roles: ["Initiator", "Durable"], counters: ["Grouped melees"], emoji: "🌊" },
  { id: "windranger", name: "Windranger", attribute: "int", roles: ["Carry", "Support", "Disabler"], counters: ["Crystal Maiden"], emoji: "💨" },
  { id: "naga_siren", name: "Naga Siren", attribute: "agi", roles: ["Carry", "Pusher"], counters: ["Supports"], emoji: "🧜" },
];

export function getHeroImageUrl(heroId: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroId}.png`;
}

export function getHeroById(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id);
}

export const SQUARE_TYPES = [
  "start", "counterpick", "combat", "ability", "trivia",
  "duel", "counterpick", "combat", "ability", "trivia",
  "expert", "counterpick", "combat", "ability", "trivia",
  "prize", "counterpick", "combat", "ability", "trivia",
];

export const SQUARE_COLORS: Record<string, string> = {
  start: "#22c55e", counterpick: "#3b82f6", combat: "#ef4444",
  ability: "#a855f7", trivia: "#f59e0b", duel: "#f97316",
  expert: "#06b6d4", prize: "#eab308",
};

export const SQUARE_LABELS: Record<string, string> = {
  start: "🏁 START", counterpick: "⚔️ Counterpick", combat: "🛡️ Combat",
  ability: "✨ Ability", trivia: "📚 Trivia", duel: "🥊 DUEL",
  expert: "🎓 EXPERT", prize: "🏆 PRIZE",
};

export const FUNNY_NICKNAMES = [
  "Fountain Camper", "Techies Fan", "Chronosphere Misser", "Rosh Feeder",
  "Divine Blocker", "Courier Killer", "Creep Denier", "Buyback Forgetter",
  "Salve Waster", "Last Pick Invoker", "Blink on Cooldown", "TP Scroll Seller",
  "Jungle AFK-er", "Pudge Misser", "Hook or Feed", "500 GPM Support",
];
