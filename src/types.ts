export interface WordHighlight {
  word: string;
  color: string;
}

export interface CaptionChunk {
  startMs: number;
  endMs: number;
  emoji?: string;
  words: WordHighlight[];
}

export type AppState = 'UPLOAD' | 'PROCESSING' | 'PREVIEW';
