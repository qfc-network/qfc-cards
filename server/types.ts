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

export interface Player {
  id: string;
  name: string;
  hp: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  field: FieldCard[];
  deck: Card[];
}

export interface GameState {
  id: string;
  players: [Player, Player];
  turn: number;
  currentPlayer: 0 | 1;
  phase: "waiting" | "playing" | "finished";
  winner: string | null;
  log: string[];
}

// Messages from client to server
export type ClientMessage =
  | { type: "join"; name: string; mode: "pvp" | "ai"; deck: string[] }
  | { type: "play_card"; cardIndex: number }
  | { type: "attack"; attackerIndex: number; targetIndex: number }
  | { type: "attack_face"; attackerIndex: number }
  | { type: "end_turn" };

// Messages from server to client
export type ServerMessage =
  | { type: "waiting" }
  | { type: "game_start"; gameId: string; playerIndex: 0 | 1; state: SanitizedGameState }
  | { type: "game_update"; state: SanitizedGameState }
  | { type: "game_over"; winner: string; state: SanitizedGameState }
  | { type: "error"; message: string };

// Game state sent to clients (hides opponent's hand/deck)
export interface SanitizedGameState {
  id: string;
  turn: number;
  currentPlayer: 0 | 1;
  phase: string;
  winner: string | null;
  log: string[];
  players: [SanitizedPlayer, SanitizedPlayer];
}

export interface SanitizedPlayer {
  name: string;
  hp: number;
  mana: number;
  maxMana: number;
  handCount: number;
  hand: Card[];  // only populated for the viewing player
  field: FieldCard[];
  deckCount: number;
}
