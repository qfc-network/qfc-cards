import { Card, FieldCard, ELEMENT_COLORS, ELEMENT_EMOJI } from "./types";

export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 170;
export const MINI_CARD_WIDTH = 90;
export const MINI_CARD_HEIGHT = 128;

export function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card | FieldCard,
  x: number, y: number,
  opts: {
    width?: number;
    height?: number;
    selected?: boolean;
    highlight?: boolean;
    faceDown?: boolean;
    dimmed?: boolean;
    targetable?: boolean;
  } = {}
): void {
  const w = opts.width ?? CARD_WIDTH;
  const h = opts.height ?? CARD_HEIGHT;
  const color = ELEMENT_COLORS[card.element];
  const emoji = ELEMENT_EMOJI[card.element];

  ctx.save();

  if (opts.dimmed) ctx.globalAlpha = 0.5;

  // Card background
  const radius = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();

  // Element color border
  ctx.lineWidth = opts.selected ? 3 : 2;
  ctx.strokeStyle = opts.selected ? "#FFD700" : opts.highlight ? "#fff" : opts.targetable ? "#FF6666" : color;
  ctx.stroke();

  if (opts.faceDown) {
    // Face-down card
    ctx.fillStyle = "#2a2a3e";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 6);
    ctx.fill();
    ctx.fillStyle = "#444";
    ctx.font = `${Math.floor(w * 0.25)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("QFC", x + w / 2, y + h / 2 + 5);
    ctx.restore();
    return;
  }

  // Element color header strip
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h * 0.22, [radius, radius, 0, 0]);
  ctx.fill();

  // Emoji + name
  const fontSize = Math.floor(w * 0.11);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.fillText(`${emoji} ${card.name}`, x + w / 2, y + h * 0.15, w - 8);

  // Cost (top right corner)
  const costSize = Math.floor(w * 0.18);
  ctx.font = `bold ${costSize}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = "#4cf";
  ctx.fillText(`${card.cost}`, x + w - 6, y + h * 0.14);

  // Ability text
  ctx.font = `italic ${Math.floor(w * 0.09)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#aaa";
  ctx.fillText(card.ability, x + w / 2, y + h * 0.38, w - 12);

  // Flavor text
  ctx.font = `${Math.floor(w * 0.075)}px sans-serif`;
  ctx.fillStyle = "#666";
  const flavorY = y + h * 0.50;
  wrapText(ctx, card.flavorText, x + w / 2, flavorY, w - 16, Math.floor(w * 0.09));

  // Attack / Defense at bottom
  const statY = y + h - 20;
  const statFont = `bold ${Math.floor(w * 0.14)}px sans-serif`;

  // Attack (left)
  ctx.font = statFont;
  ctx.textAlign = "left";
  ctx.fillStyle = "#FF6666";
  ctx.fillText(`⚔${card.attack}`, x + 8, statY);

  // Defense (right)
  ctx.textAlign = "right";
  const isField = "currentDefense" in card;
  const def = isField ? (card as FieldCard).currentDefense : card.defense;
  const defColor = isField && def < card.defense ? "#FF8800" : "#66AAFF";
  ctx.fillStyle = defColor;
  ctx.fillText(`🛡${def}`, x + w - 8, statY);

  // Can-attack indicator
  if (isField && (card as FieldCard).canAttack) {
    ctx.fillStyle = "#44FF44";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number
): void {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let lines = 0;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY, maxWidth);
      line = word;
      currentY += lineHeight;
      lines++;
      if (lines >= 2) break;
    } else {
      line = testLine;
    }
  }
  if (line && lines < 2) {
    ctx.fillText(line, x, currentY, maxWidth);
  }
}

export function drawCardBack(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number = MINI_CARD_WIDTH, h: number = MINI_CARD_HEIGHT
): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#333";
  ctx.font = `${Math.floor(w * 0.2)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("QFC", x + w / 2, y + h / 2 + 5);
  ctx.restore();
}
