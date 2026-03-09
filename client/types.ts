export type Element = "fire" | "water" | "earth" | "lightning" | "shadow";

export interface Card {
  id: string;
  name: string;
  element: Element;
  attack: number;
  defense: number;
  cost: number;
  ability: string;
  flavorText: string;
}

export interface FieldCard extends Card {
  currentDefense: number;
  canAttack: boolean;
}

export interface SanitizedPlayer {
  name: string;
  hp: number;
  mana: number;
  maxMana: number;
  handCount: number;
  hand: Card[];
  field: FieldCard[];
  deckCount: number;
}

export interface SanitizedGameState {
  id: string;
  turn: number;
  currentPlayer: 0 | 1;
  phase: string;
  winner: string | null;
  log: string[];
  players: [SanitizedPlayer, SanitizedPlayer];
}

export type ServerMessage =
  | { type: "waiting" }
  | { type: "game_start"; gameId: string; playerIndex: 0 | 1; state: SanitizedGameState }
  | { type: "game_update"; state: SanitizedGameState }
  | { type: "game_over"; winner: string; state: SanitizedGameState }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "join"; name: string; mode: "pvp" | "ai"; deck: string[] }
  | { type: "play_card"; cardIndex: number }
  | { type: "attack"; attackerIndex: number; targetIndex: number }
  | { type: "attack_face"; attackerIndex: number }
  | { type: "end_turn" };

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: "#FF4444",
  water: "#4488FF",
  earth: "#44AA44",
  lightning: "#FFAA00",
  shadow: "#8844AA",
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  fire: "🔥",
  water: "💧",
  earth: "🌿",
  lightning: "⚡",
  shadow: "🌑",
};
