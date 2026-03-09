import { Card, Element } from "./types.js";

const ELEMENT_COLORS: Record<Element, string> = {
  fire: "#FF4444",
  water: "#4488FF",
  earth: "#44AA44",
  lightning: "#FFAA00",
  shadow: "#8844AA",
};

// 30 pre-generated starter cards (6 per element)
export const STARTER_CARDS: Card[] = [
  // Fire cards (6)
  { id: "fire-1", name: "Ember Sprite", element: "fire", attack: 3, defense: 2, cost: 2, ability: "Quick Strike", flavorText: "Born from the first spark." },
  { id: "fire-2", name: "Blaze Wolf", element: "fire", attack: 5, defense: 3, cost: 3, ability: "Fierce Charge", flavorText: "Hunts in packs of flame." },
  { id: "fire-3", name: "Inferno Drake", element: "fire", attack: 7, defense: 4, cost: 4, ability: "Flame Breath", flavorText: "Its breath melts stone." },
  { id: "fire-4", name: "Magma Golem", element: "fire", attack: 6, defense: 6, cost: 5, ability: "Molten Core", flavorText: "Forged in the planet's heart." },
  { id: "fire-5", name: "Ash Dancer", element: "fire", attack: 4, defense: 1, cost: 2, ability: "Ignite", flavorText: "Dances on dying embers." },
  { id: "fire-6", name: "Phoenix Warden", element: "fire", attack: 8, defense: 5, cost: 5, ability: "Rebirth Flame", flavorText: "Death is merely a pause." },

  // Water cards (6)
  { id: "water-1", name: "Tide Caller", element: "water", attack: 2, defense: 4, cost: 2, ability: "Tidal Shield", flavorText: "Commands the ocean's will." },
  { id: "water-2", name: "Frost Serpent", element: "water", attack: 4, defense: 5, cost: 3, ability: "Freeze", flavorText: "Cold as the deep abyss." },
  { id: "water-3", name: "Storm Kraken", element: "water", attack: 7, defense: 6, cost: 5, ability: "Whirlpool", flavorText: "Ancient terror of the seas." },
  { id: "water-4", name: "Coral Guard", element: "water", attack: 3, defense: 7, cost: 4, ability: "Reef Wall", flavorText: "A living fortress of coral." },
  { id: "water-5", name: "Mist Phantom", element: "water", attack: 5, defense: 3, cost: 3, ability: "Vanish", flavorText: "Seen only in fog." },
  { id: "water-6", name: "Abyssal Leviathan", element: "water", attack: 9, defense: 4, cost: 5, ability: "Deep Crush", flavorText: "From depths unknown." },

  // Earth cards (6)
  { id: "earth-1", name: "Stone Sentinel", element: "earth", attack: 2, defense: 6, cost: 3, ability: "Fortify", flavorText: "Unmovable, unyielding." },
  { id: "earth-2", name: "Vine Weaver", element: "earth", attack: 3, defense: 3, cost: 2, ability: "Entangle", flavorText: "Nature's gentle grip." },
  { id: "earth-3", name: "Quake Beast", element: "earth", attack: 6, defense: 5, cost: 4, ability: "Tremor", flavorText: "The ground fears its steps." },
  { id: "earth-4", name: "Ancient Treant", element: "earth", attack: 5, defense: 8, cost: 5, ability: "Root Wall", flavorText: "Older than memory." },
  { id: "earth-5", name: "Boulder Imp", element: "earth", attack: 4, defense: 4, cost: 3, ability: "Rock Throw", flavorText: "Small but solid." },
  { id: "earth-6", name: "Crystal Golem", element: "earth", attack: 7, defense: 7, cost: 5, ability: "Diamond Skin", flavorText: "Refracts all light." },

  // Lightning cards (6)
  { id: "lightning-1", name: "Spark Wisp", element: "lightning", attack: 4, defense: 1, cost: 1, ability: "Zap", flavorText: "Quick as thought." },
  { id: "lightning-2", name: "Thunder Hawk", element: "lightning", attack: 5, defense: 3, cost: 3, ability: "Dive Bolt", flavorText: "Strikes from storm clouds." },
  { id: "lightning-3", name: "Storm Elemental", element: "lightning", attack: 6, defense: 4, cost: 4, ability: "Chain Lightning", flavorText: "Pure energy given form." },
  { id: "lightning-4", name: "Volt Tiger", element: "lightning", attack: 8, defense: 2, cost: 4, ability: "Thunder Pounce", flavorText: "Outruns the lightning." },
  { id: "lightning-5", name: "Static Shade", element: "lightning", attack: 3, defense: 3, cost: 2, ability: "Paralyze", flavorText: "A flickering menace." },
  { id: "lightning-6", name: "Tempest Dragon", element: "lightning", attack: 9, defense: 5, cost: 5, ability: "Storm Fury", flavorText: "Master of the skies." },

  // Shadow cards (6)
  { id: "shadow-1", name: "Shade Walker", element: "shadow", attack: 3, defense: 3, cost: 2, ability: "Stealth", flavorText: "Walks between shadows." },
  { id: "shadow-2", name: "Void Wraith", element: "shadow", attack: 5, defense: 2, cost: 3, ability: "Life Drain", flavorText: "Feeds on fading souls." },
  { id: "shadow-3", name: "Night Stalker", element: "shadow", attack: 6, defense: 4, cost: 4, ability: "Ambush", flavorText: "You never see it coming." },
  { id: "shadow-4", name: "Doom Herald", element: "shadow", attack: 7, defense: 5, cost: 5, ability: "Curse", flavorText: "Speaks only endings." },
  { id: "shadow-5", name: "Gloom Rat", element: "shadow", attack: 2, defense: 2, cost: 1, ability: "Scurry", flavorText: "Thrives in darkness." },
  { id: "shadow-6", name: "Abyss Lord", element: "shadow", attack: 10, defense: 3, cost: 5, ability: "Oblivion", flavorText: "The void incarnate." },
];

export function getAllCards(): Card[] {
  return STARTER_CARDS;
}

export function getCardById(id: string): Card | undefined {
  return STARTER_CARDS.find(c => c.id === id);
}

export function getCardsByIds(ids: string[]): Card[] {
  return ids.map(id => getCardById(id)).filter((c): c is Card => c !== undefined);
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Element advantage: Fire > Earth > Lightning > Water > Fire, Shadow neutral
const ADVANTAGE_MAP: Record<Element, Element> = {
  fire: "earth",
  earth: "lightning",
  lightning: "water",
  water: "fire",
  shadow: "shadow", // shadow has no advantage
};

export function hasAdvantage(attacker: Element, defender: Element): boolean {
  if (attacker === "shadow" || defender === "shadow") return false;
  return ADVANTAGE_MAP[attacker] === defender;
}

export { ELEMENT_COLORS };
