import { SanitizedGameState, FieldCard, Card } from "./types";
import { drawCard, drawCardBack, CARD_WIDTH, CARD_HEIGHT, MINI_CARD_WIDTH, MINI_CARD_HEIGHT } from "./CardRenderer";

export interface ClickTarget {
  type: "hand_card" | "my_field" | "opp_field" | "opp_face";
  index: number;
}

interface CardAnimation {
  type: "play" | "attack" | "damage" | "death";
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: SanitizedGameState | null = null;
  private playerIndex: 0 | 1 = 0;
  private clickTargets: { rect: [number, number, number, number]; target: ClickTarget }[] = [];
  private animations: CardAnimation[] = [];
  private hoveredTarget: ClickTarget | null = null;
  private selectedAttacker: number | null = null; // field index of selected attacker

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Track hover
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.hoveredTarget = this.hitTest(x, y);
      canvas.style.cursor = this.hoveredTarget ? "pointer" : "default";
    });
  }

  resize(): void {
    const logWidth = 240;
    this.canvas.width = window.innerWidth - logWidth;
    this.canvas.height = window.innerHeight;
    if (this.state) this.render();
  }

  setState(state: SanitizedGameState, playerIndex: 0 | 1): void {
    this.state = state;
    this.playerIndex = playerIndex;
    this.render();
  }

  setSelectedAttacker(idx: number | null): void {
    this.selectedAttacker = idx;
    if (this.state) this.render();
  }

  getSelectedAttacker(): number | null {
    return this.selectedAttacker;
  }

  hitTest(x: number, y: number): ClickTarget | null {
    for (const { rect, target } of this.clickTargets) {
      if (x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3]) {
        return target;
      }
    }
    return null;
  }

  onClick(x: number, y: number): ClickTarget | null {
    return this.hitTest(x, y);
  }

  private render(): void {
    const { ctx, canvas, state } = this;
    if (!state) return;

    const W = canvas.width;
    const H = canvas.height;

    this.clickTargets = [];

    // Clear
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    const me = state.players[this.playerIndex];
    const opp = state.players[this.playerIndex === 0 ? 1 : 0];
    const isMyTurn = state.currentPlayer === this.playerIndex;

    // Layout zones
    const oppInfoY = 10;
    const oppFieldY = 70;
    const fieldCardH = CARD_HEIGHT * 0.85;
    const fieldCardW = CARD_WIDTH * 0.85;
    const myFieldY = H * 0.38;
    const myHandY = H - CARD_HEIGHT - 20;

    // --- Opponent info bar ---
    this.drawPlayerBar(opp.name, opp.hp, opp.mana, opp.maxMana, opp.deckCount, opp.handCount, oppInfoY, false);

    // --- Opponent field ---
    this.drawFieldCards(opp.field, oppFieldY, fieldCardW, fieldCardH, "opp_field");

    // Opponent face target (clickable area between opp bar and field)
    if (this.selectedAttacker !== null) {
      this.clickTargets.push({
        rect: [W / 2 - 60, oppInfoY, 120, 50],
        target: { type: "opp_face", index: 0 },
      });
      // Draw face target highlight
      ctx.save();
      ctx.strokeStyle = "#FF4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(W / 2 - 60, oppInfoY, 120, 50);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // --- Divider ---
    const divY = (oppFieldY + fieldCardH + myFieldY) / 2;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, divY);
    ctx.lineTo(W - 20, divY);
    ctx.stroke();

    // Turn indicator
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = isMyTurn ? "#44FF44" : "#FF4444";
    ctx.fillText(isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN", W / 2, divY - 5);
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Turn ${state.turn}`, W / 2, divY + 14);

    // --- My field ---
    this.drawFieldCards(me.field, myFieldY, fieldCardW, fieldCardH, "my_field");

    // --- My info bar ---
    this.drawPlayerBar(me.name, me.hp, me.mana, me.maxMana, me.deckCount, me.hand.length, myHandY - 35, true);

    // --- My hand ---
    this.drawHand(me.hand, myHandY, isMyTurn, me.mana);
  }

  private drawPlayerBar(
    name: string, hp: number, mana: number, maxMana: number,
    deckCount: number, handCount: number,
    y: number, isMe: boolean
  ): void {
    const { ctx } = this;
    const W = this.canvas.width;

    ctx.save();
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = isMe ? "#4488FF" : "#FF6666";
    ctx.fillText(name, 20, y + 18);

    // HP
    ctx.fillStyle = "#FF4444";
    ctx.fillText(`❤ ${hp}/20`, 180, y + 18);

    // Mana
    ctx.fillStyle = "#4cf";
    ctx.fillText(`💎 ${mana}/${maxMana}`, 300, y + 18);

    // Deck/hand count
    ctx.fillStyle = "#888";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Deck: ${deckCount} | Hand: ${handCount}`, 420, y + 18);

    ctx.restore();
  }

  private drawFieldCards(
    field: FieldCard[], y: number,
    cardW: number, cardH: number,
    type: "my_field" | "opp_field"
  ): void {
    const { ctx } = this;
    const W = this.canvas.width;
    const totalW = field.length * (cardW + 12) - 12;
    let startX = (W - totalW) / 2;

    for (let i = 0; i < field.length; i++) {
      const x = startX + i * (cardW + 12);
      const isSelected = type === "my_field" && this.selectedAttacker === i;
      const isTargetable = type === "opp_field" && this.selectedAttacker !== null;

      drawCard(ctx, field[i], x, y, {
        width: cardW,
        height: cardH,
        selected: isSelected,
        targetable: isTargetable,
        dimmed: type === "my_field" && !field[i].canAttack && this.selectedAttacker === null,
      });

      this.clickTargets.push({
        rect: [x, y, cardW, cardH],
        target: { type, index: i },
      });
    }

    if (field.length === 0) {
      ctx.save();
      ctx.fillStyle = "#222";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(type === "my_field" ? "Your field (play cards here)" : "Opponent's field", W / 2, y + cardH / 2);
      ctx.restore();
    }
  }

  private drawHand(hand: Card[], y: number, isMyTurn: boolean, mana: number): void {
    const { ctx } = this;
    const W = this.canvas.width;
    const totalW = hand.length * (CARD_WIDTH + 8) - 8;
    let startX = (W - totalW) / 2;

    for (let i = 0; i < hand.length; i++) {
      const x = startX + i * (CARD_WIDTH + 8);
      const canPlay = isMyTurn && hand[i].cost <= mana;
      const isHovered = this.hoveredTarget?.type === "hand_card" && this.hoveredTarget.index === i;

      drawCard(ctx, hand[i], x, isHovered ? y - 10 : y, {
        highlight: canPlay && isHovered,
        dimmed: !canPlay,
      });

      this.clickTargets.push({
        rect: [x, y - 10, CARD_WIDTH, CARD_HEIGHT + 10],
        target: { type: "hand_card", index: i },
      });
    }
  }
}
