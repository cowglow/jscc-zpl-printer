# Spike: Canvas Label Editor

## What we're building

A live canvas preview of the ZPL label that the user can see and interact with before printing. Text fields (name, company, tags, hashtag) are rendered as draggable, editable blocks on the canvas. Changes on the canvas update the form fields and vice versa. The final print still sends ZPL — the canvas is a preview/editing surface, not the print artifact.

---

## Challenges

### 1. Canvas is not the DOM — text editing is hard
HTML `<canvas>` has no native text cursor, selection, or IME support. Implementing an inline text editor from scratch (caret blinking, keyboard nav, cut/copy/paste, undo) is a significant amount of work and brittle across platforms.

**Mitigation:** Use a floating `<textarea>` overlay positioned over the active canvas text block. The textarea handles all native input behavior; the canvas just reads the final value and redraws.

### 2. ZPL coordinates ≠ pixel coordinates
ZPL uses dots at a fixed DPI (203 or 300 dpi). The canvas must scale those dot coordinates to CSS pixels so the preview looks proportionally correct, and it must invert the transform when writing positions back to ZPL.

**Mitigation:** Define a single `scale` constant (canvas px per ZPL dot) and apply it uniformly in both directions. For a 4×6 in label at 203 dpi: 812×1218 ZPL dots → rendered at ~0.5 scale = 406×609 px canvas.

### 3. Font rendering differs between canvas and ZPL printer
The ZPL `^CF` command uses internal printer fonts that have no web equivalent. Canvas will render system fonts that only approximate the layout. Line breaks and text overflow will not be pixel-perfect.

**Mitigation:** Treat the canvas as a "close enough" layout guide, not a pixel-perfect proof. Document this clearly. Pick a monospace or condensed sans-serif font for the canvas that approximates the ZPL proportions.

### 4. Tags block is multi-line with `^FB` wrapping
ZPL's `^FB` wraps text at a fixed dot width across N lines. Replicating this in canvas requires manually measuring text and breaking it — `measureText()` works but `^FB` and canvas wrapping logic will diverge slightly.

**Mitigation:** Implement a simple word-wrap function using `ctx.measureText()` with the same scaled max-width as the `^FB` column. Accept minor visual differences for long tag lists.

### 5. Drag-to-reposition changes ZPL `^FO` values
If we let users drag text blocks, we need to round the resulting canvas position back to valid ZPL dot offsets and clamp to label bounds.

**Mitigation:** Snap drag endpoints to the nearest dot (reverse-scale), clamp to label dimensions, and update the ZPL template's `^FO` values accordingly.

### 6. State sync between canvas and form inputs
Two sources of truth (form fields + canvas) will fight each other if not carefully wired. Changes from the form must reflect on the canvas; changes from clicking directly on the canvas must update the form.

**Mitigation:** Single source of truth: a `LabelState` object. Form inputs and canvas both read from and write to it. Use a lightweight event emitter (or just a `dispatchEvent`) to signal updates.

---

## Solution Overview

```
┌─────────────────────────────────────────────┐
│                 LabelState                  │  ← single source of truth
│  { name, company, tags, positions[] }       │
└─────┬─────────────────────┬─────────────────┘
      │ read/write           │ read/write
      ▼                      ▼
┌──────────────┐    ┌──────────────────────────┐
│  Form inputs │    │   <canvas> + overlay     │
│  (existing)  │    │   <textarea> on focus    │
└──────────────┘    └──────────────────────────┘
      │ on change            │ on draw/drag/click
      └────────────┬─────────┘
                   ▼
           renderCanvas()  ──→  generateZPL(LabelState)
```

**Key pieces:**

| Piece | What it does |
|---|---|
| `LabelState` | Plain object + change event. Owns all label data and block positions. |
| `renderCanvas(ctx, state)` | Stateless draw function. Draws background, all text blocks, selection handles. |
| `TextBlock` | Describes one editable region: text content, ZPL `^FO` position, font size, max-width. |
| Floating `<textarea>` | Positioned over the active block on focus; syncs back to `LabelState` on `input`. |
| Drag handler | `pointerdown/move/up` on canvas; hit-tests blocks, updates `LabelState.positions`. |
| `zplFromState(state)` | Replaces hardcoded `createJSCCLabel`; reads `LabelState` for positions and text. |

---

## Game Plan

### Phase 0 — Foundation (no visible UI change)
- [ ] Define `TextBlock` and `LabelState` types in `src/client/canvas/types.ts`
- [ ] Write `defaultLabelState(data: LabelData): LabelState` that seeds positions from current ZPL hardcoded values
- [ ] Write `zplFromState(state: LabelState): string` — replaces `createJSCCLabel`, same output for default state
- [ ] Unit test: `zplFromState(defaultLabelState(data))` matches current `createJSCCLabel(data)` output

### Phase 1 — Canvas render (read-only preview)
- [ ] Add `<canvas id="label-preview">` below the form
- [ ] Write `renderCanvas(ctx, state)` — draws label bg, all text blocks with correct scaling
- [ ] Wire form inputs → update `LabelState` → call `renderCanvas`
- [ ] Verify visual proportions match actual printed labels

### Phase 2 — Inline text editing
- [ ] On canvas click: hit-test to find which `TextBlock` was clicked
- [ ] Position floating `<textarea>` over that block
- [ ] On `textarea` input: update `LabelState.text` for that block → `renderCanvas`
- [ ] On `textarea` blur: hide overlay, sync form inputs from `LabelState`
- [ ] Keyboard: `Tab` cycles to next block; `Escape` cancels edit

### Phase 3 — Drag to reposition
- [ ] `pointerdown` on canvas: if inside a block, begin drag
- [ ] `pointermove`: update block position in `LabelState` → `renderCanvas`
- [ ] `pointerup`: snap to dot grid, clamp to label bounds, finalize
- [ ] Show position values in a small status bar (optional, helps debugging)

### Phase 4 — Wire to print
- [ ] Replace `createJSCCLabel(data)` call in `form-element.ts` with `zplFromState(state)`
- [ ] Confirm printed output still correct for default (non-dragged) label
- [ ] Test drag → reposition → print round-trip

---

## Out of scope for this spike
- Font selection or size changes
- Adding new text blocks beyond the four existing ones (name, company, tags, hashtag)
- Undo/redo
- Mobile touch drag (pointer events cover touch, but layout may need a separate pass)
- Pixel-perfect font matching to ZPL printer fonts

---

## Files to create

```
src/client/canvas/
  types.ts          ← TextBlock, LabelState
  state.ts          ← defaultLabelState(), zplFromState()
  render.ts         ← renderCanvas()
  editor.ts         ← canvas click/drag/textarea overlay wiring
```

Existing file touched: `src/client/lib/formElement/form-element.ts` (swap ZPL generator, add canvas init)

---

## Definition of Ready

- [ ] This spec reviewed and approved
- [ ] Label physical dimensions confirmed (inches + DPI so scale constant is accurate)
- [ ] Decision: drag-to-reposition in scope for spike or deferred to follow-on?
- [ ] Decision: canvas replaces form or lives alongside it (layout question)?