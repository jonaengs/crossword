import { Coordinate } from './controls';

export interface EmptyCellValue {
  type: 'empty';
}

export interface CorrectedCellValue {
  type: 'corrected';
  value: string;
}

export interface UserInputCellValue {
  type: 'user';
  value: string;
}

export interface DraftCellValue {
  type: 'draft';
  value: string;
}

export interface BlockedCell {
  type: 'blocked';
}

export type AnyCell = EmptyCellValue | CorrectedCellValue | UserInputCellValue | DraftCellValue | BlockedCell;

export interface BaseHint {
  label: string;
  /** Inclusive */
  start: Coordinate;
  /** Inclusive */
  end: Coordinate;
}

export interface AnnotatedHint extends BaseHint {
  direction: 'across' | 'down';
  index: number;
}

/** Arrays are always sorted in ascending order */
export interface BaseHints {
  across: BaseHint[];
  down: BaseHint[];
}

export interface AnnotatedHints {
  across: AnnotatedHint[];
  down: AnnotatedHint[];
}

// TODO: Convert into a class
export interface Crossword {
  /** Row major */
  cells: AnyCell[][];
  hints: AnnotatedHints;
}
