export interface Track {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  file: File;
  duration: number; // in seconds
}

export type LoopMode = 'none' | 'all' | 'one';
