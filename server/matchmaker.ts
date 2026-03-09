import { WebSocket } from "ws";

interface WaitingPlayer {
  ws: WebSocket;
  name: string;
  deck: string[];
}

let waitingPlayer: WaitingPlayer | null = null;

export function addToQueue(ws: WebSocket, name: string, deck: string[]): WaitingPlayer | null {
  if (waitingPlayer && waitingPlayer.ws.readyState === WebSocket.OPEN) {
    // Match found
    const opponent = waitingPlayer;
    waitingPlayer = null;
    return opponent;
  }

  // No match, wait
  waitingPlayer = { ws, name, deck };
  return null;
}

export function removeFromQueue(ws: WebSocket): void {
  if (waitingPlayer && waitingPlayer.ws === ws) {
    waitingPlayer = null;
  }
}
