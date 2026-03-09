import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { GameState, ClientMessage, ServerMessage } from "./types.js";
import { getAllCards } from "./cards.js";
import { createGame, playCard, attackCard, attackFace, endTurn, sanitizeState } from "./game.js";
import { addToQueue, removeFromQueue } from "./matchmaker.js";
import { aiTurn } from "./ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3220;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Serve static files (production build)
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.use(express.json());

// REST API
app.get("/api/cards", (_req, res) => {
  res.json(getAllCards());
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Game rooms: gameId -> { state, players: [ws, ws] }
interface GameRoom {
  state: GameState;
  players: [WebSocket, WebSocket | null]; // null = AI slot
  playerIndices: Map<WebSocket, 0 | 1>;
}

const games = new Map<string, GameRoom>();
const playerGames = new Map<WebSocket, string>();

function sendMsg(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastState(room: GameRoom): void {
  const { state, players, playerIndices } = room;

  for (const ws of players) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const idx = playerIndices.get(ws)!;
      if (state.phase === "finished") {
        sendMsg(ws, { type: "game_over", winner: state.winner!, state: sanitizeState(state, idx) });
      } else {
        sendMsg(ws, { type: "game_update", state: sanitizeState(state, idx) });
      }
    }
  }
}

function getDefaultAIDeck(): string[] {
  // AI picks a balanced deck: 3 cards from each element
  const elements = ["fire", "water", "earth", "lightning", "shadow"];
  const allCards = getAllCards();
  const deck: string[] = [];
  for (const el of elements) {
    const elCards = allCards.filter(c => c.element === el);
    // Pick 3 cards from each element
    for (let i = 0; i < 3 && i < elCards.length; i++) {
      deck.push(elCards[i].id);
    }
  }
  return deck;
}

function handleAiGame(ws: WebSocket, name: string, deck: string[]): void {
  const aiId = "ai-" + uuid();
  const aiDeck = getDefaultAIDeck();
  const state = createGame(uuid(), name, deck, aiId, "AI Opponent", aiDeck);

  const room: GameRoom = {
    state,
    players: [ws, null],
    playerIndices: new Map([[ws, 0]]),
  };

  games.set(state.id, room);
  playerGames.set(ws, state.id);

  sendMsg(ws, {
    type: "game_start",
    gameId: state.id,
    playerIndex: 0,
    state: sanitizeState(state, 0),
  });
}

function handlePvpJoin(ws: WebSocket, name: string, deck: string[]): void {
  const opponent = addToQueue(ws, name, deck);

  if (!opponent) {
    sendMsg(ws, { type: "waiting" });
    return;
  }

  // Match found — create game
  const state = createGame(
    uuid(), opponent.name, opponent.deck,
    uuid(), name, deck
  );

  const room: GameRoom = {
    state,
    players: [opponent.ws, ws],
    playerIndices: new Map([
      [opponent.ws, 0],
      [ws, 1],
    ]),
  };

  games.set(state.id, room);
  playerGames.set(opponent.ws, state.id);
  playerGames.set(ws, state.id);

  sendMsg(opponent.ws, {
    type: "game_start",
    gameId: state.id,
    playerIndex: 0,
    state: sanitizeState(state, 0),
  });

  sendMsg(ws, {
    type: "game_start",
    gameId: state.id,
    playerIndex: 1,
    state: sanitizeState(state, 1),
  });
}

function handleMessage(ws: WebSocket, msg: ClientMessage): void {
  switch (msg.type) {
    case "join": {
      if (msg.mode === "ai") {
        handleAiGame(ws, msg.name, msg.deck);
      } else {
        handlePvpJoin(ws, msg.name, msg.deck);
      }
      break;
    }

    case "play_card":
    case "attack":
    case "attack_face":
    case "end_turn": {
      const gameId = playerGames.get(ws);
      if (!gameId) return;

      const room = games.get(gameId);
      if (!room) return;

      const playerIdx = room.playerIndices.get(ws);
      if (playerIdx === undefined) return;

      const { state } = room;
      let success = false;

      if (msg.type === "play_card") {
        success = playCard(state, playerIdx, msg.cardIndex);
      } else if (msg.type === "attack") {
        success = attackCard(state, playerIdx, msg.attackerIndex, msg.targetIndex);
      } else if (msg.type === "attack_face") {
        success = attackFace(state, playerIdx, msg.attackerIndex);
      } else if (msg.type === "end_turn") {
        success = endTurn(state, playerIdx);
      }

      if (!success) {
        sendMsg(ws, { type: "error", message: "Invalid action." });
      }

      broadcastState(room);

      // AI turn (if PvE and it's AI's turn)
      if (room.players[1] === null && state.currentPlayer === 1 && state.phase === "playing") {
        setTimeout(() => {
          aiTurn(state, 1);
          broadcastState(room);
        }, 800);
      }

      break;
    }
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());
      handleMessage(ws, msg);
    } catch {
      sendMsg(ws, { type: "error", message: "Invalid message format." });
    }
  });

  ws.on("close", () => {
    removeFromQueue(ws);
    const gameId = playerGames.get(ws);
    if (gameId) {
      const room = games.get(gameId);
      if (room && room.state.phase === "playing") {
        room.state.phase = "finished";
        // Other player wins by disconnect
        const otherIdx = room.playerIndices.get(ws) === 0 ? 1 : 0;
        room.state.winner = room.state.players[otherIdx].name;
        room.state.log.push(`${room.state.players[room.playerIndices.get(ws)!].name} disconnected.`);
        broadcastState(room);
      }
      playerGames.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`QFC AI Cards server running on http://localhost:${PORT}`);
});
