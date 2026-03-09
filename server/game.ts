import { v4 as uuid } from "uuid";
import { GameState, Player, Card, FieldCard, SanitizedGameState, SanitizedPlayer } from "./types.js";
import { getCardsByIds, shuffleDeck, hasAdvantage } from "./cards.js";

const STARTING_HP = 20;
const STARTING_MANA = 5;
const MAX_MANA = 10;
const HAND_LIMIT = 7;
const MAX_FIELD = 4;
const INITIAL_DRAW = 4;
const ELEMENT_BONUS = 2;

export function createGame(
  p1Id: string, p1Name: string, p1DeckIds: string[],
  p2Id: string, p2Name: string, p2DeckIds: string[]
): GameState {
  const p1Deck = shuffleDeck(getCardsByIds(p1DeckIds));
  const p2Deck = shuffleDeck(getCardsByIds(p2DeckIds));

  const p1: Player = {
    id: p1Id, name: p1Name, hp: STARTING_HP,
    mana: STARTING_MANA, maxMana: STARTING_MANA,
    hand: [], field: [], deck: p1Deck,
  };
  const p2: Player = {
    id: p2Id, name: p2Name, hp: STARTING_HP,
    mana: STARTING_MANA, maxMana: STARTING_MANA,
    hand: [], field: [], deck: p2Deck,
  };

  const state: GameState = {
    id: uuid(),
    players: [p1, p2],
    turn: 1,
    currentPlayer: 0,
    phase: "playing",
    winner: null,
    log: [],
  };

  // Initial draw
  for (let i = 0; i < INITIAL_DRAW; i++) {
    drawCard(state, 0);
    drawCard(state, 1);
  }

  state.log.push(`Game started! ${p1Name} vs ${p2Name}`);
  state.log.push(`${p1Name}'s turn.`);

  return state;
}

function drawCard(state: GameState, playerIdx: 0 | 1): boolean {
  const player = state.players[playerIdx];
  if (player.deck.length === 0) return false;
  if (player.hand.length >= HAND_LIMIT) {
    state.log.push(`${player.name}'s hand is full! Card burned.`);
    player.deck.shift();
    return false;
  }
  const card = player.deck.shift()!;
  player.hand.push(card);
  return true;
}

export function playCard(state: GameState, playerIdx: 0 | 1, cardIndex: number): boolean {
  if (state.phase !== "playing") return false;
  if (state.currentPlayer !== playerIdx) return false;

  const player = state.players[playerIdx];
  if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

  const card = player.hand[cardIndex];
  if (card.cost > player.mana) return false;
  if (player.field.length >= MAX_FIELD) return false;

  player.mana -= card.cost;
  player.hand.splice(cardIndex, 1);

  const fieldCard: FieldCard = {
    ...card,
    currentDefense: card.defense,
    canAttack: false, // summoning sickness
  };
  player.field.push(fieldCard);

  state.log.push(`${player.name} played ${card.name} (${card.element}).`);
  return true;
}

export function attackCard(
  state: GameState, playerIdx: 0 | 1,
  attackerIndex: number, targetIndex: number
): boolean {
  if (state.phase !== "playing") return false;
  if (state.currentPlayer !== playerIdx) return false;

  const attacker = state.players[playerIdx];
  const defender = state.players[playerIdx === 0 ? 1 : 0];

  if (attackerIndex < 0 || attackerIndex >= attacker.field.length) return false;
  if (targetIndex < 0 || targetIndex >= defender.field.length) return false;

  const atkCard = attacker.field[attackerIndex];
  const defCard = defender.field[targetIndex];

  if (!atkCard.canAttack) return false;

  let damage = atkCard.attack;
  if (hasAdvantage(atkCard.element, defCard.element)) {
    damage += ELEMENT_BONUS;
    state.log.push(`Element advantage! +${ELEMENT_BONUS} damage.`);
  }

  defCard.currentDefense -= damage;
  atkCard.currentDefense -= defCard.attack;
  atkCard.canAttack = false;

  state.log.push(`${atkCard.name} attacks ${defCard.name} for ${damage} damage.`);

  // Remove destroyed cards
  if (defCard.currentDefense <= 0) {
    defender.field.splice(targetIndex, 1);
    state.log.push(`${defCard.name} was destroyed!`);
  }
  if (atkCard.currentDefense <= 0) {
    attacker.field.splice(attackerIndex, 1);
    state.log.push(`${atkCard.name} was destroyed!`);
  }

  return true;
}

export function attackFace(
  state: GameState, playerIdx: 0 | 1, attackerIndex: number
): boolean {
  if (state.phase !== "playing") return false;
  if (state.currentPlayer !== playerIdx) return false;

  const attacker = state.players[playerIdx];
  const defender = state.players[playerIdx === 0 ? 1 : 0];

  if (attackerIndex < 0 || attackerIndex >= attacker.field.length) return false;

  const atkCard = attacker.field[attackerIndex];
  if (!atkCard.canAttack) return false;

  defender.hp -= atkCard.attack;
  atkCard.canAttack = false;

  state.log.push(`${atkCard.name} attacks ${defender.name} for ${atkCard.attack} damage!`);

  if (defender.hp <= 0) {
    defender.hp = 0;
    state.phase = "finished";
    state.winner = attacker.name;
    state.log.push(`${attacker.name} wins!`);
  }

  return true;
}

export function endTurn(state: GameState, playerIdx: 0 | 1): boolean {
  if (state.phase !== "playing") return false;
  if (state.currentPlayer !== playerIdx) return false;

  // Switch to other player
  state.currentPlayer = playerIdx === 0 ? 1 : 0;
  const nextPlayer = state.players[state.currentPlayer];

  // Increment turn counter
  if (state.currentPlayer === 0) state.turn++;

  // Increase mana
  nextPlayer.maxMana = Math.min(nextPlayer.maxMana + 1, MAX_MANA);
  nextPlayer.mana = nextPlayer.maxMana;

  // Draw a card
  drawCard(state, state.currentPlayer);

  // Wake up field cards
  for (const card of nextPlayer.field) {
    card.canAttack = true;
  }

  state.log.push(`${nextPlayer.name}'s turn. (Mana: ${nextPlayer.mana})`);
  return true;
}

export function sanitizeState(state: GameState, forPlayerIdx: 0 | 1): SanitizedGameState {
  const otherIdx = forPlayerIdx === 0 ? 1 : 0;

  const sanitizePlayer = (p: Player, isViewer: boolean): SanitizedPlayer => ({
    name: p.name,
    hp: p.hp,
    mana: p.mana,
    maxMana: p.maxMana,
    handCount: p.hand.length,
    hand: isViewer ? p.hand : [],
    field: p.field,
    deckCount: p.deck.length,
  });

  return {
    id: state.id,
    turn: state.turn,
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    winner: state.winner,
    log: state.log.slice(-20), // Last 20 log entries
    players: [
      sanitizePlayer(state.players[0], forPlayerIdx === 0),
      sanitizePlayer(state.players[1], forPlayerIdx === 1),
    ],
  };
}
