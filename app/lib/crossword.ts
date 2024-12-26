import { ControllerState, Coordinate } from './controls';

export interface EmptyCellValue {
  type: 'empty';
}

export interface RevealedCellValue {
  type: 'corrected';
  value: string;
}

export interface WrongCellValue {
  type: 'wrong';
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

export type BuilderCell = EmptyCellValue | UserInputCellValue | BlockedCell;
export type AnyCell = BuilderCell | RevealedCellValue | DraftCellValue | WrongCellValue;

// TODO: Allow connecting hints. For cases where it's like "see 6-across" in the 1-down. Probably a connectedHints: label[] should suffice

export interface Run {
  /** Inclusive */
  start: Coordinate;
  /** Inclusive */
  end: Coordinate;
}

export interface BaseHint {
  text: string;
  run: Run;
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
export interface EditableCrossword {
  /** Row major */
  cells: BuilderCell[][];
  hints: AnnotatedHints;
}

// TODO: Convert into a class
export interface SolvableCrossword {
  /** Row major */
  cells: AnyCell[][];
  hints: AnnotatedHints;
}

export interface Dimensions {
  rows: number;
  cols: number;
}

export function dims(cells: unknown[][]): Dimensions {
  return { rows: cells.length, cols: cells[0]?.length ?? 0 };
}

export function coordsEqual(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.col === b.col;
}

const MIN_RUN_LENGTH = 3;

export function computeHints(cells: AnyCell[][]): BaseHints {
  const across: BaseHint[] = [];
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i]!;
    let start = 0;
    let end = 0;
    while (end < row.length) {
      if (row[end]!.type === 'blocked') {
        if (start < end && end - start >= MIN_RUN_LENGTH) {
          across.push({ text: '', run: { start: { row: i, col: start }, end: { row: i, col: end - 1 } } });
        }
        start = end + 1;
      }
      end += 1;
    }
    if (start < end && end - start >= MIN_RUN_LENGTH) {
      across.push({ text: '', run: { start: { row: i, col: start }, end: { row: i, col: end - 1 } } });
    }
  }

  const down: BaseHint[] = [];
  for (let i = 0; i < (cells[0]?.length ?? 0); i++) {
    let start = 0;
    let end = 0;
    while (end < cells.length) {
      if (cells[end]![i]!.type === 'blocked') {
        if (start < end && end - start >= MIN_RUN_LENGTH) {
          down.push({ text: '', run: { start: { row: start, col: i }, end: { row: end - 1, col: i } } });
        }
        start = end + 1;
      }
      end += 1;
    }
    if (start < end && end - start >= MIN_RUN_LENGTH) {
      down.push({ text: '', run: { start: { row: start, col: i }, end: { row: end - 1, col: i } } });
    }
  }

  return {
    across,
    down,
  };
}

export function mergeHints(oldHints: BaseHints, newHints: BaseHints): BaseHints {
  function mergeHintArray(
    oldHints: BaseHint[],
    newHints: BaseHint[],
    compareFn: (a: BaseHint, b: BaseHint) => number,
  ): BaseHint[] {
    // Keep all hints that are in both old and new
    const toKeep = oldHints.filter((oldHint) =>
      newHints.some(
        (newHint) => coordsEqual(oldHint.run.start, newHint.run.start) && coordsEqual(oldHint.run.end, newHint.run.end),
      ),
    );
    // Add all hints that are in new but not in old
    const toAdd = newHints.filter(
      (newHint) =>
        !toKeep.some(
          (oldHint) =>
            coordsEqual(oldHint.run.start, newHint.run.start) && coordsEqual(oldHint.run.end, newHint.run.end),
        ),
    );
    // (implicit) Remove all hints that are in old but not in new

    const merged = [...toKeep, ...toAdd];
    merged.sort(compareFn);
    return merged;
  }

  const across = mergeHintArray(oldHints.across, newHints.across, (a, b) => {
    if (a.run.start.row !== b.run.start.row) {
      return a.run.start.row - b.run.start.row;
    }
    return a.run.start.col - b.run.start.col;
  });
  const down = mergeHintArray(oldHints.down, newHints.down, (a, b) => {
    if (a.run.start.col !== b.run.start.col) {
      return a.run.start.col - b.run.start.col;
    }
    return a.run.start.row - b.run.start.row;
  });
  return { across, down };
}

export function annotateHints(hints: BaseHints): AnnotatedHints {
  function hintPos(hint: BaseHint): string {
    return JSON.stringify(hint.run.start);
  }

  const combinedHints = [...hints.across, ...hints.down];
  combinedHints.sort((a, b) => {
    return a.run.start.row - b.run.start.row || a.run.start.col - b.run.start.col;
  });
  const hitIdToPosition: Record<string, number> = {};
  let index = 0;
  let prevHintId: string | null = null;
  for (const hint of combinedHints) {
    const hintIdStr = hintPos(hint);
    if (prevHintId !== hintIdStr) {
      index += 1;
    }
    hitIdToPosition[hintIdStr] = index;
    prevHintId = hintIdStr;
  }

  const down: AnnotatedHint[] = hints.down.map((hint) => ({
    ...hint,
    direction: 'down',
    index: hitIdToPosition[hintPos(hint)]!,
  }));
  const across: AnnotatedHint[] = hints.across.map((hint) => ({
    ...hint,
    direction: 'across',
    index: hitIdToPosition[hintPos(hint)]!,
  }));
  return {
    across: across,
    down: down,
  };
}

export function getHintNumberForCoordinate(hints: AnnotatedHints, { row, col }: Coordinate): string | null {
  const hintAcross = hints.across.find((hint) => hint.run.start.row === row && hint.run.start.col == col);
  const hintDown = hints.down.find((hint) => hint.run.start.row === row && hint.run.start.col == col);
  return hintDown?.index.toString() || hintAcross?.index.toString() || null;
}

export function initCrosswordCells(rows: number, cols: number): EmptyCellValue[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ type: 'empty' })));
}

export function initCrossword(rows: number, cols: number): EditableCrossword {
  const cells = initCrosswordCells(rows, cols);
  return {
    cells,
    hints: annotateHints(computeHints(cells)),
  };
}

/** Assumes index is a valid index into the cells matrix */
export function findFirstNonblocked(
  cells: AnyCell[][],
  direction: { axis: 'row' | 'col'; index: number },
): number | null {
  const array = direction.axis === 'row' ? cells.map((row) => row[direction.index]!) : cells[direction.index]!;
  const idx = array.findIndex((cell) => cell.type !== 'blocked');
  return idx >= 0 ? idx : null;
}

/**
 * Returns the run that the cursor is currently in.
 * If the cursor is currently inside a blocked cell, the run becomes the entire col/row.
 * TODO: Consider making this last part controllable with an optional parameter
 */
export function getCursorRun(cells: AnyCell[][], controller: ControllerState): Run {
  function findRun(array: AnyCell[], initialIndex: number) {
    if (array[initialIndex]!.type === 'blocked') {
      return { start: 0, end: array.length - 1 };
    }

    let start = initialIndex;
    let end = start;
    while (start >= 0 && array[start]!.type !== 'blocked') {
      start -= 1;
    }
    while (end < array.length && array[end]!.type !== 'blocked') {
      end += 1;
    }
    return { start: start + 1, end: end - 1 };
  }

  const {
    cursor,
    controls: { direction },
  } = controller;

  if (direction === 'horizontal') {
    const bounds = findRun(cells[cursor.row]!, cursor.col);
    return { start: { row: cursor.row, col: bounds.start }, end: { row: cursor.row, col: bounds.end } };
  } else {
    const array = cells.map((row) => row[cursor.col]!);
    const bounds = findRun(array, cursor.row);
    return { start: { row: bounds.start, col: cursor.col }, end: { row: bounds.end, col: cursor.col } };
  }
}

export function isInRun(coord: Coordinate, run: Run): boolean {
  const isRow = run.start.row <= coord.row && run.end.row >= coord.row;
  const isCol = run.start.col <= coord.col && run.end.col >= coord.col;
  return isRow && isCol;
}

export function isCursorInHintRun(hint: AnnotatedHint, cursor: Coordinate): boolean {
  return isInRun(cursor, hint.run);
}
