import { Card, ServerMessage, ELEMENT_COLORS, ELEMENT_EMOJI } from "./types";
import { connect, send, fetchCards, disconnect } from "./api";
import { BattleUI } from "./BattleUI";
import { drawCard, CARD_WIDTH, CARD_HEIGHT } from "./CardRenderer";

// DOM elements
const menuEl = document.getElementById("menu")!;
const deckSelectEl = document.getElementById("deck-select")!;
const waitingEl = document.getElementById("waiting")!;
const battleEl = document.getElementById("battle")!;
const endScreenEl = document.getElementById("end-screen")!;
const nameInput = document.getElementById("player-name") as HTMLInputElement;
const deckCountEl = document.getElementById("deck-count")!;
const cardPoolEl = document.getElementById("card-pool")!;
const startBattleBtn = document.getElementById("start-battle") as HTMLButtonElement;

let allCards: Card[] = [];
let selectedDeck: Set<string> = new Set();
let gameMode: "pvp" | "ai" = "ai";
let battleUI: BattleUI | null = null;

// Screen management
function showScreen(id: string): void {
  [menuEl, deckSelectEl, waitingEl, battleEl, endScreenEl].forEach(el => {
    el.style.display = "none";
  });
  document.getElementById(id)!.style.display = id === "battle" ? "block" : "";
  // Flex for non-battle screens
  if (id !== "battle") {
    document.getElementById(id)!.style.display = "flex";
    document.getElementById(id)!.style.flexDirection = "column";
    document.getElementById(id)!.style.alignItems = "center";
    document.getElementById(id)!.style.justifyContent = "center";
  }
}

// Initialize
async function init(): Promise<void> {
  allCards = await fetchCards();
  showScreen("menu");

  document.getElementById("btn-pvp")!.addEventListener("click", () => {
    gameMode = "pvp";
    showDeckSelect();
  });

  document.getElementById("btn-ai")!.addEventListener("click", () => {
    gameMode = "ai";
    showDeckSelect();
  });

  document.getElementById("btn-back-menu")!.addEventListener("click", () => {
    showScreen("menu");
  });

  document.getElementById("btn-cancel-wait")!.addEventListener("click", () => {
    disconnect();
    showScreen("menu");
  });

  document.getElementById("btn-play-again")!.addEventListener("click", () => {
    disconnect();
    showScreen("menu");
  });

  startBattleBtn.addEventListener("click", () => {
    if (selectedDeck.size !== 15) return;
    startGame();
  });
}

function showDeckSelect(): void {
  selectedDeck.clear();
  updateDeckCount();
  renderCardPool();
  showScreen("deck-select");
}

function renderCardPool(): void {
  cardPoolEl.innerHTML = "";

  for (const card of allCards) {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 170;
    canvas.className = "deck-card";
    canvas.dataset.cardId = card.id;

    const ctx = canvas.getContext("2d")!;
    drawCard(ctx, card, 0, 0, { width: 120, height: 170 });

    canvas.addEventListener("click", () => {
      if (selectedDeck.has(card.id)) {
        selectedDeck.delete(card.id);
        canvas.classList.remove("selected");
      } else if (selectedDeck.size < 15) {
        selectedDeck.add(card.id);
        canvas.classList.add("selected");
      }
      updateDeckCount();
    });

    cardPoolEl.appendChild(canvas);
  }
}

function updateDeckCount(): void {
  deckCountEl.textContent = String(selectedDeck.size);
  startBattleBtn.disabled = selectedDeck.size !== 15;
}

function startGame(): void {
  const name = nameInput.value.trim() || "Player";

  connect(handleServerMessage);

  // Small delay to ensure WS is open
  setTimeout(() => {
    send({
      type: "join",
      name,
      mode: gameMode,
      deck: Array.from(selectedDeck),
    });
  }, 300);

  if (gameMode === "pvp") {
    showScreen("waiting");
  }
}

function handleServerMessage(msg: ServerMessage): void {
  switch (msg.type) {
    case "waiting":
      showScreen("waiting");
      break;

    case "game_start": {
      showScreen("battle");
      const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
      battleUI = new BattleUI(canvas);
      battleUI.setPlayerIndex(msg.playerIndex);
      battleUI.update(msg.state);
      break;
    }

    case "game_update":
      battleUI?.update(msg.state);
      break;

    case "game_over": {
      battleUI?.update(msg.state);
      // Show end screen after delay
      setTimeout(() => {
        showScreen("end-screen");
        const title = document.getElementById("end-title")!;
        const result = document.getElementById("end-result")!;
        const myName = msg.state.players[battleUI ? 0 : 0].name;
        if (msg.winner === myName) {
          title.textContent = "Victory!";
          title.style.color = "#44FF44";
          result.textContent = "You defeated your opponent!";
        } else {
          title.textContent = "Defeat";
          title.style.color = "#FF4444";
          result.textContent = `${msg.winner} wins.`;
        }
      }, 1500);
      break;
    }

    case "error":
      console.error("Server error:", msg.message);
      break;
  }
}

// Start app
init();
