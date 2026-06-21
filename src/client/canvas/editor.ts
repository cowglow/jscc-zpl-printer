import { SCALE, LABEL_W, LABEL_H, BLOCK_LAYOUT } from './config.ts';
import { defaultLabelState, updateBlockText, moveBlock, selectBlock, zplFromState } from './state.ts';
import { renderCanvas, hitBlock, CANVAS_W, CANVAS_H, blockBounds } from './render.ts';
import type { BlockId, LabelState } from './types.ts';

// How many canvas pixels the pointer must move before a pointerdown becomes a drag.
const DRAG_THRESHOLD = 4;

type Interaction =
  | { mode: 'idle' }
  | { mode: 'pending'; blockId: BlockId; startCx: number; startCy: number; offsetDotX: number; offsetDotY: number }
  | { mode: 'dragging'; blockId: BlockId; offsetDotX: number; offsetDotY: number }
  | { mode: 'editing'; blockId: BlockId };

// Converts a PointerEvent position into canvas-internal coordinates,
// accounting for any CSS scaling applied to the canvas element.
function toCanvasPx(canvas: HTMLCanvasElement, e: PointerEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return [
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top)  * scaleY,
  ];
}

function isReadonly(blockId: BlockId): boolean {
  return BLOCK_LAYOUT.find(b => b.id === blockId)?.readonly === true;
}

export function initEditor(canvas: HTMLCanvasElement, form: HTMLFormElement): void {
  const ctx = canvas.getContext('2d')!;

  canvas.width  = CANVAS_W();
  canvas.height = CANVAS_H();

  let state: LabelState = defaultLabelState();
  let interaction: Interaction = { mode: 'idle' };

  function draw(): void { renderCanvas(ctx, state); }

  // ── Canvas interactions ─────────────────────────────────────────────────────

  const overlay = createTextOverlay();

  canvas.addEventListener('pointerdown', (e) => {
    if (interaction.mode === 'editing') return;
    const [cx, cy] = toCanvasPx(canvas, e);
    const blockId  = hitBlock(state, cx, cy, ctx);

    if (!blockId) {
      state = selectBlock(state, undefined);
      draw();
      return;
    }

    const block = state.blocks.find(b => b.id === blockId)!;
    canvas.setPointerCapture(e.pointerId);
    interaction = {
      mode:       'pending',
      blockId,
      startCx:    cx,
      startCy:    cy,
      offsetDotX: cx / SCALE - block.x,
      offsetDotY: cy / SCALE - block.y,
    };
    state = selectBlock(state, blockId);
    draw();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (interaction.mode !== 'pending' && interaction.mode !== 'dragging') return;
    const [cx, cy] = toCanvasPx(canvas, e);

    if (interaction.mode === 'pending') {
      const dx = cx - interaction.startCx;
      const dy = cy - interaction.startCy;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      interaction = { mode: 'dragging', blockId: interaction.blockId, offsetDotX: interaction.offsetDotX, offsetDotY: interaction.offsetDotY };
      canvas.style.cursor = 'grabbing';
    }

    const newDotX = cx / SCALE - interaction.offsetDotX;
    const newDotY = cy / SCALE - interaction.offsetDotY;
    state = moveBlock(state, interaction.blockId, Math.max(0, Math.min(newDotX, LABEL_W)), Math.max(0, Math.min(newDotY, LABEL_H)));
    draw();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (interaction.mode === 'idle' || interaction.mode === 'editing') return;
    canvas.style.cursor = '';

    if (interaction.mode === 'dragging') {
      interaction = { mode: 'idle' };
      return;
    }

    // pending without movement → click → open text overlay (unless readonly)
    const { blockId } = interaction;

    if (isReadonly(blockId)) {
      interaction = { mode: 'idle' };
      return;
    }

    interaction = { mode: 'editing', blockId };
    const block  = state.blocks.find(b => b.id === blockId)!;
    const bounds = blockBounds(ctx, block);

    // Clear token placeholder text when the user first opens a block for editing.
    const isToken = block.text.startsWith('{') && block.text.endsWith('}');
    const initialText = isToken ? '' : block.text;

    showTextOverlay(overlay, canvas, initialText, bounds, (text) => {
      state = updateBlockText(state, blockId, text);
      draw();
    }, () => {
      // Restore the token if the user closed the overlay without typing anything.
      const current = state.blocks.find(b => b.id === blockId)!.text;
      const defaultToken = BLOCK_LAYOUT.find(b => b.id === blockId)!.defaultToken;
      if (!current.trim()) state = updateBlockText(state, blockId, defaultToken);
      interaction = { mode: 'idle' };
      state = selectBlock(state, undefined);
      draw();
    });
    void e;
  });

  canvas.addEventListener('pointercancel', () => {
    interaction = { mode: 'idle' };
    canvas.style.cursor = '';
    draw();
  });

  // Cursor feedback on hover
  canvas.addEventListener('pointermove', (e) => {
    if (interaction.mode !== 'idle') return;
    const [cx, cy] = toCanvasPx(canvas, e);
    const blockId = hitBlock(state, cx, cy, ctx);
    if (!blockId) { canvas.style.cursor = 'default'; return; }
    canvas.style.cursor = isReadonly(blockId) ? 'grab' : 'text';
  });

  // ── Form submit ─────────────────────────────────────────────────────────────

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const zpl = zplFromState(state);
    const printerName = form.querySelector<HTMLInputElement>('#editor-printer-name')?.value ?? '';
    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/print', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ zpl, printerName }),
      });
      if (res.ok) {
        alert('✅ Label sent to printer!');
      } else {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        alert(`Error: ${String(err['error'] ?? `Server error ${res.status}`)}`);
      }
    } catch {
      alert('[Editor:print] Network error. Could not send ZPL.');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  draw();
}

// ── Textarea overlay helpers ──────────────────────────────────────────────────

function createTextOverlay(): HTMLTextAreaElement {
  const ta = document.createElement('textarea');
  ta.style.cssText = [
    'position:fixed',
    'display:none',
    'resize:none',
    'border:2px solid #b06bff',
    'border-radius:4px',
    'background:rgba(255,255,255,0.97)',
    'font-family:Verdana,sans-serif',
    'padding:2px 4px',
    'box-sizing:border-box',
    'z-index:100',
    'line-height:1.25',
  ].join(';');
  document.body.appendChild(ta);
  return ta;
}

function showTextOverlay(
  ta: HTMLTextAreaElement,
  canvas: HTMLCanvasElement,
  initialText: string,
  bounds: { x: number; y: number; w: number; h: number },
  onChange: (text: string) => void,
  onDone: () => void,
): void {
  const rect     = canvas.getBoundingClientRect();
  const cssScaleX = rect.width  / canvas.width;
  const cssScaleY = rect.height / canvas.height;

  ta.value          = initialText;
  ta.style.left     = `${rect.left + bounds.x * cssScaleX}px`;
  ta.style.top      = `${rect.top  + bounds.y * cssScaleY}px`;
  ta.style.width    = `${bounds.w * cssScaleX}px`;
  ta.style.height   = `${Math.max(bounds.h * cssScaleY, 32)}px`;
  ta.style.fontSize = `${Math.max(bounds.h * cssScaleY / (ta.rows || 1), 12)}px`;
  ta.style.display  = 'block';
  ta.focus();

  function onInput() { onChange(ta.value); }

  function cleanup() {
    ta.style.display = 'none';
    ta.removeEventListener('input',   onInput);
    ta.removeEventListener('blur',    onBlurHandler);
    ta.removeEventListener('keydown', onKeydown);
    onDone();
  }

  function onBlurHandler() { cleanup(); }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { ta.blur(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ta.blur(); }
  }

  ta.addEventListener('input',   onInput);
  ta.addEventListener('blur',    onBlurHandler);
  ta.addEventListener('keydown', onKeydown);
}