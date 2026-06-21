export type BlockId = 'name' | 'company' | 'tags' | 'hashtag';

export type TextBlock = {
  id: BlockId;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  maxWidth?: number;
  maxLines?: number;
};

export type LabelState = {
  blocks: TextBlock[];
  selectedId?: BlockId;
};