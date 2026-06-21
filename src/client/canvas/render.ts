import { LABEL_W, LABEL_H, SCALE } from './config.ts';
import type { BlockId, LabelState, TextBlock } from './types.ts';

export const CANVAS_W = (): number => LABEL_W * SCALE;
export const CANVAS_H = (): number => LABEL_H * SCALE;

function blockFont(block: TextBlock): string {
  return `${Math.round(block.fontSize * SCALE)}px Verdana, sans-serif`;
}

// Word-wraps text to fit within maxPx wide, up to maxLines lines.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxPx: number, maxLines: number): string[] {
  const words = text.split(/[ ,]+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current}, ${word}` : word;
    if (ctx.measureText(candidate).width > maxPx && current) {
      lines.push(current);
      if (lines.length >= maxLines) return lines;
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

// Returns the pixel bounding box of a block in canvas coordinates.
export function blockBounds(ctx: CanvasRenderingContext2D, block: TextBlock): { x: number; y: number; w: number; h: number } {
  ctx.font = blockFont(block);
  const lineH = block.fontSize * SCALE * 1.25;
  const w = block.maxWidth
    ? block.maxWidth * SCALE
    : ctx.measureText(block.text || 'M').width;
  const h = lineH * (block.maxLines ?? 1);
  return { x: block.x * SCALE, y: block.y * SCALE, w, h };
}

// Hit-tests canvas coordinates against all blocks. Returns the topmost match.
export function hitBlock(state: LabelState, cx: number, cy: number, ctx: CanvasRenderingContext2D): BlockId | undefined {
  for (const block of [...state.blocks].reverse()) {
    const { x, y, w, h } = blockBounds(ctx, block);
    if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) return block.id;
  }
  return undefined;
}

export function renderCanvas(ctx: CanvasRenderingContext2D, state: LabelState): void {
  const cw = CANVAS_W();
  const ch = CANVAS_H();

  ctx.clearRect(0, 0, cw, ch);

  // Label background and border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);

  // Logo placeholder (GRF file not available in browser)
  const logoX = 50 * SCALE;
  const logoY = 30 * SCALE;
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(logoX, logoY, 220 * SCALE, 35 * SCALE);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('LOGO.GRF', logoX + 4, logoY + 4);

  ctx.textBaseline = 'top';

  for (const block of state.blocks) {
    const x  = block.x * SCALE;
    const y  = block.y * SCALE;
    const fs = block.fontSize * SCALE;
    const isSelected = block.id === state.selectedId;

    ctx.font = blockFont(block);

    // Selection / hover highlight
    if (isSelected) {
      const { w, h } = blockBounds(ctx, block);
      ctx.fillStyle = 'rgba(176, 107, 255, 0.12)';
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.strokeStyle = '#b06bff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    }

    // Token placeholders ({Name}, {Company}, etc.) render muted to signal they're not real data yet.
    const isToken = block.text.startsWith('{') && block.text.endsWith('}');
    ctx.fillStyle = isToken ? '#aaaaaa' : '#222222';

    if (block.maxWidth && block.maxLines) {
      const lines = wrapText(ctx, block.text, block.maxWidth * SCALE, block.maxLines);
      lines.forEach((line, i) => ctx.fillText(line, x, y + i * fs * 1.25));
    } else {
      ctx.fillText(block.text || '​', x, y);
    }
  }
}