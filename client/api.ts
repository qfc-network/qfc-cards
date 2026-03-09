import { Card, ClientMessage, ServerMessage } from "./types";

let ws: WebSocket | null = null;
let messageHandler: ((msg: ServerMessage) => void) | null = null;

export function connect(onMessage: (msg: ServerMessage) => void): void {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${location.host}/ws`;
  ws = new WebSocket(url);
  messageHandler = onMessage;

  ws.onmessage = (event) => {
    const msg: ServerMessage = JSON.parse(event.data);
    messageHandler?.(msg);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

export function send(msg: ClientMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function disconnect(): void {
  ws?.close();
  ws = null;
}

export async function fetchCards(): Promise<Card[]> {
  const res = await fetch("/api/cards");
  return res.json();
}
