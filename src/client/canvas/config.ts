import { JSCC_YEAR } from '../../shared/constants.ts';
import type { BlockId, TextBlock } from './types.ts';

// Label physical dimensions in ZPL dots.
// Landscape badge: 4×3 inch at 300 DPI → 1200×900 dots.
// Override at runtime by calling setLabelSize() after fetching /label-config.
export let LABEL_W = 1200;
export let LABEL_H = 900;

// Canvas pixels per ZPL dot — controls preview size.
// At 0.5: 1200×900 dots → 600×450px canvas.
export const SCALE = 0.5;

// Block layout: positions and font sizes in ZPL dots.
// These map directly to ^FO (x,y) and ^CF (fontSize) in ZPL output.
//
// Tuning guide:
//   fontSize  — ZPL dots tall. Divide by DPI (300) to get inches.
//               e.g. fontSize 100 = 0.33" ≈ 24pt
//   defaultX/Y — top-left origin of the text field in ZPL dots.
//   maxWidth  — max line width for ^FB word-wrap (dots). Keep ≤ LABEL_W - defaultX.
//   maxLines  — max wrapped lines for the tags block.
//
// Update this when the label design changes between events.
export type BlockLayout = {
  id: BlockId;
  defaultX: number;
  defaultY: number;
  fontSize: number;
  defaultToken: string;  // placeholder shown on canvas before the user edits
  readonly?: boolean;    // true = draggable but not text-editable (e.g. the hashtag constant)
  maxWidth?: number;
  maxLines?: number;
};

export const BLOCK_LAYOUT: readonly BlockLayout[] = [
  { id: 'name',    defaultX: 50, defaultY: 50,  fontSize: 100, defaultToken: '{Name}' },
  { id: 'company', defaultX: 50, defaultY: 175, fontSize: 80,  defaultToken: '{Company}' },
  { id: 'tags',    defaultX: 50, defaultY: 280, fontSize: 50,  defaultToken: '{HTML, CSS, JS}', maxWidth: 1100, maxLines: 3 },
  { id: 'hashtag', defaultX: 50, defaultY: 620, fontSize: 150, defaultToken: `#JSCC${JSCC_YEAR}`, readonly: true },
];

// Snap dragged positions to this dot grid to keep ZPL coordinates clean.
export const SNAP_GRID = 5;

// Allows the canvas to update its size after a /label-config fetch.
export function setLabelSize(w: number, h: number): void {
  LABEL_W = w;
  LABEL_H = h;
}

// ZPL template — the only place where the command structure lives.
// Receives the current block states so drag-repositioned ^FO values are reflected.
export function buildZPL(blocks: readonly TextBlock[]): string {
  const get = (id: BlockId): TextBlock => blocks.find(b => b.id === id)!;
  const name    = get('name');
  const company = get('company');
  const tags    = get('tags');
  const hashtag = get('hashtag');

  return `^XA
^CI28

^FO50,30^XGLOGO.GRF,1,1^FS

^CF0,${name.fontSize}
^FO${name.x},${name.y}^FD${name.text}^FS

^CF0,${company.fontSize}
^FO${company.x},${company.y}^FD${company.text}^FS

^CF0,${tags.fontSize}
^FO${tags.x},${tags.y}
^FB${tags.maxWidth ?? 1100},${tags.maxLines ?? 4},0,L,0
^FD${tags.text}^FS

^CF0,${hashtag.fontSize}
^FO${hashtag.x},${hashtag.y}^FD${hashtag.text}^FS

^XZ`.trim();
}