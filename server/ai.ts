import { GameState } from "./types.js";
import { playCard, attackCard, attackFace, endTurn } from "./game.js";
import { hasAdvantage } from "./cards.js";

/**
 * AI opponent logic:
 * 1. Play cards: prioritize highest attack affordable cards
 * 2. Attack: target weakest opposing card, or face if no cards
 * 3. End turn
 */
export function aiTurn(state: GameState, aiIdx: 0 | 1): void {
  const ai = state.players[aiIdx];
  const opponent = state.players[aiIdx === 0 ? 1 : 0];

  // Phase 1: Play cards (highest attack first that we can afford)
  let played = true;
  while (played) {
    played = false;
    // Sort hand by attack descending, pick best affordable card
    const affordableCards = ai.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.cost <= ai.mana && ai.field.length < 4)
      .sort((a, b) => b.card.attack - a.card.attack);

    if (affordableCards.length > 0) {
      const best = affordableCards[0];
      if (playCard(state, aiIdx, best.index)) {
        played = true;
      }
    }
  }

  // Phase 2: Attack with field cards
  for (let i = ai.field.length - 1; i >= 0; i--) {
    const atkCard = ai.field[i];
    if (!atkCard.canAttack) continue;

    if (opponent.field.length > 0) {
      // Find best target: prefer element advantage, then weakest defense
      let bestTarget = 0;
      let bestScore = -Infinity;

      for (let j = 0; j < opponent.field.length; j++) {
        const target = opponent.field[j];
        let score = -target.currentDefense; // prefer weaker targets
        if (hasAdvantage(atkCard.element, target.element)) {
          score += 10; // strongly prefer element advantage
        }
        // Prefer targets we can kill
        const damage = atkCard.attack + (hasAdvantage(atkCard.element, target.element) ? 2 : 0);
        if (damage >= target.currentDefense) {
          score += 5;
        }
        if (score > bestScore) {
          bestScore = score;
          bestTarget = j;
        }
      }

      // Attack the target — recalculate index since field may have shifted
      if (i < ai.field.length) {
        attackCard(state, aiIdx, i, bestTarget);
      }
    } else {
      // No opposing cards — attack face
      if (i < ai.field.length) {
        attackFace(state, aiIdx, i);
      }
    }

    if (state.phase === "finished") return;
  }

  // Phase 3: End turn
  endTurn(state, aiIdx);
}
