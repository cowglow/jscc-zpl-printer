import { BLOCK_LAYOUT, LABEL_W, LABEL_H, SNAP_GRID, buildZPL } from './config.ts';
import type { BlockId, LabelState, TextBlock } from './types.ts';

export function defaultLabelState(): LabelState {
  return {
    blocks: BLOCK_LAYOUT.map((layout): TextBlock => ({
      id:        layout.id,
      text:      layout.defaultToken,
      x:         layout.defaultX,
      y:         layout.defaultY,
      fontSize:  layout.fontSize,
      maxWidth:  layout.maxWidth,
      maxLines:  layout.maxLines,
    })),
  };
}

export function updateBlockText(state: LabelState, id: BlockId, text: string): LabelState {
  return {
    ...state,
    blocks: state.blocks.map((b): TextBlock => b.id === id ? { ...b, text } : b),
  };
}

export function moveBlock(state: LabelState, id: BlockId, x: number, y: number): LabelState {
  const snapped = {
    x: Math.round(x / SNAP_GRID) * SNAP_GRID,
    y: Math.round(y / SNAP_GRID) * SNAP_GRID,
  };
  const clamped = {
    x: Math.max(0, Math.min(snapped.x, LABEL_W)),
    y: Math.max(0, Math.min(snapped.y, LABEL_H)),
  };
  return {
    ...state,
    blocks: state.blocks.map((b): TextBlock => b.id === id ? { ...b, ...clamped } : b),
  };
}

export function selectBlock(state: LabelState, id?: BlockId): LabelState {
  return { ...state, selectedId: id };
}

export function zplFromState(state: LabelState): string {
  return buildZPL(state.blocks);
}