declare module 'refractor/core' {
  const refractor: {
    register: (language: any) => void;
    highlight: (code: string, language: string) => any[];
    alias: (name: string, alias: string | string[]) => void;
  };
  export default refractor;
}

declare module 'refractor/lang/javascript' {
  const javascript: any;
  export default javascript;
}

declare module 'react-diff-view' {
  import { ReactNode } from 'react';

  export interface Change {
    type: 'insert' | 'delete' | 'normal';
    content: string;
    lineNumber?: number;  // For insert and normal changes
    oldLineNumber?: number; // For delete and normal changes
  }

  export interface NormalChange extends Change {
    type: 'normal';
    oldLineNumber: number;
    lineNumber: number;
  }

  export interface InsertChange extends Change {
    type: 'insert';
    lineNumber: number;
  }

  export interface DeleteChange extends Change {
    type: 'delete';
    oldLineNumber: number;
  }

  export interface Hunk {
    content: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    changes: Change[];
  }

  export interface DiffFile {
    type: string;
    hunks: Hunk[] | null;
    oldRevision: string;
    newRevision: string;
    oldPath: string;
    newPath: string;
  }

  export interface DiffProps {
    viewType: 'unified' | 'split';
    diffType: string;
    hunks: Hunk[];
    children?: (hunks: Hunk[]) => ReactNode;
    className?: string;
    gutterType?: 'default' | 'none' | 'anchor';
    selectedChanges?: string[];
    widgets?: Record<string, ReactNode>;
    tokens?: any;
    optimizeSelection?: boolean;
  }

  export interface HunkProps {
    hunk: Hunk;
    gutterEvents?: Record<string, (e: any) => void>;
    codeEvents?: Record<string, (e: any) => void>;
    className?: string;
    lineClassName?: string;
    gutterClassName?: string;
    codeClassName?: string;
  }

  export function Diff(props: DiffProps): JSX.Element;
  export function Hunk(props: HunkProps): JSX.Element;
  export function tokenize(hunks: Hunk[], options: any): any;
  export function markEdits(hunks: Hunk[], options?: any): any;
  export function parseDiff(text: string, options?: any): DiffFile[];
  export function getChangeKey(change: Change): string;
} 