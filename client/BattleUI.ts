import { GameRenderer, ClickTarget } from "./GameRenderer";
import { SanitizedGameState, ClientMessage } from "./types";
import { send } from "./api";

export class BattleUI {
  private renderer: GameRenderer;
  private state: SanitizedGameState | null = null;
  private playerIndex: 0 | 1 = 0;
  private logEl: HTMLElement;
  private endTurnBtn: HTMLButtonElement;
  private attackFaceBtn: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new GameRenderer(canvas);
    this.logEl = document.getElementById("game-log")!;
    this.endTurnBtn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    this.attackFaceBtn = document.getElementById("btn-attack-face") as HTMLButtonElement;

    // Canvas click
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const target = this.renderer.onClick(x, y);
      if (target) this.handleClick(target);
    });

    // End turn button
    this.endTurnBtn.addEventListener("click", () => {
      if (this.isMyTurn()) {
        send({ type: "end_turn" });
        this.renderer.setSelectedAttacker(null);
      }
    });

    // Attack face button
    this.attackFaceBtn.addEventListener("click", () => {
      const attacker = this.renderer.getSelectedAttacker();
      if (attacker !== null && this.isMyTurn()) {
        send({ type: "attack_face", attackerIndex: attacker });
        this.renderer.setSelectedAttacker(null);
      }
    });
  }

  setPlayerIndex(idx: 0 | 1): void {
    this.playerIndex = idx;
  }

  update(state: SanitizedGameState): void {
    this.state = state;
    this.renderer.setState(state, this.playerIndex);
    this.updateLog();
    this.updateButtons();
  }

  private isMyTurn(): boolean {
    return this.state?.currentPlayer === this.playerIndex && this.state?.phase === "playing";
  }

  private updateButtons(): void {
    const myTurn = this.isMyTurn();
    this.endTurnBtn.disabled = !myTurn;
    this.attackFaceBtn.disabled = !myTurn || this.renderer.getSelectedAttacker() === null;
  }

  private updateLog(): void {
    if (!this.state) return;
    const entries = this.state.log;
    // Keep only log entries, preserve the h3
    const h3 = this.logEl.querySelector("h3");
    this.logEl.innerHTML = "";
    if (h3) this.logEl.appendChild(h3);

    for (const entry of entries) {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.textContent = entry;
      this.logEl.appendChild(div);
    }
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private handleClick(target: ClickTarget): void {
    if (!this.isMyTurn()) return;

    const me = this.state!.players[this.playerIndex];
    const selectedAttacker = this.renderer.getSelectedAttacker();

    switch (target.type) {
      case "hand_card": {
        // Play card from hand
        const card = me.hand[target.index];
        if (card && card.cost <= me.mana && me.field.length < 4) {
          send({ type: "play_card", cardIndex: target.index });
          this.renderer.setSelectedAttacker(null);
        }
        break;
      }

      case "my_field": {
        // Select/deselect attacker
        const fieldCard = me.field[target.index];
        if (fieldCard?.canAttack) {
          if (selectedAttacker === target.index) {
            this.renderer.setSelectedAttacker(null);
          } else {
            this.renderer.setSelectedAttacker(target.index);
          }
        }
        this.updateButtons();
        break;
      }

      case "opp_field": {
        // Attack opponent's card
        if (selectedAttacker !== null) {
          send({
            type: "attack",
            attackerIndex: selectedAttacker,
            targetIndex: target.index,
          });
          this.renderer.setSelectedAttacker(null);
        }
        break;
      }

      case "opp_face": {
        // Attack opponent's face
        if (selectedAttacker !== null) {
          send({ type: "attack_face", attackerIndex: selectedAttacker });
          this.renderer.setSelectedAttacker(null);
        }
        break;
      }
    }
  }
}
