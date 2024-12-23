import { ReactNode, createContext, useContext, useState } from 'react';
import { AnyCell, Crossword, EmptyCellValue, BaseHint, AnnotatedHints, BaseHints, AnnotatedHint } from './crossword';
import {
  ControllerState,
  Controls,
  Coordinate,
  Cursor,
  Direction,
  DirectionalCommand,
  convertDirectionalCommand,
  coordsEqual,
  toggleDirection,
} from './controls';
import { AnyInput } from './input';
import { clamp } from './numbers';

const MIN_RUN_LENGTH = 2;

interface CrosswordApplicationState {
  crossword: Crossword;
  controller: ControllerState;
  setCell: (coords: Coordinate, value: AnyCell) => void;
  handleInput: (input: AnyInput) => void;
  setController: (coords: Coordinate, direction: Direction) => void;
  setHint: (direction: 'across' | 'down', index: number, label: string) => void;
}

function dims(crossword: Crossword): { rows: number; cols: number } {
  return { rows: crossword.cells.length, cols: crossword.cells[0]?.length ?? 0 };
}

function computeHints(cells: AnyCell[][]): BaseHints {
  const across: BaseHint[] = [];
  for (let i = 0; i < cells.length; i++) {
    const row = cells[i]!;
    let start = 0;
    let end = 0;
    while (end < row.length) {
      if (row[end]!.type === 'blocked') {
        if (start < end && end - start >= MIN_RUN_LENGTH) {
          across.push({ label: '', start: { row: i, col: start }, end: { row: i, col: end - 1 } });
        }
        start = end + 1;
      }
      end += 1;
    }
    if (start < end && end - start >= MIN_RUN_LENGTH) {
      across.push({ label: '', start: { row: i, col: start }, end: { row: i, col: end - 1 } });
    }
  }

  const down: BaseHint[] = [];
  for (let i = 0; i < (cells[0]?.length ?? 0); i++) {
    let start = 0;
    let end = 0;
    while (end < cells.length) {
      if (cells[end]![i]!.type === 'blocked') {
        if (start < end && end - start >= MIN_RUN_LENGTH) {
          down.push({ label: '', start: { row: start, col: i }, end: { row: end - 1, col: i } });
        }
        start = end + 1;
      }
      end += 1;
    }
    if (start < end && end - start >= MIN_RUN_LENGTH) {
      down.push({ label: '', start: { row: start, col: i }, end: { row: end - 1, col: i } });
    }
  }

  return {
    across,
    down,
  };
}

function mergeHints(oldHints: BaseHints, newHints: BaseHints): BaseHints {
  function mergeHintArray(
    oldHints: BaseHint[],
    newHints: BaseHint[],
    compareFn: (a: BaseHint, b: BaseHint) => number,
  ): BaseHint[] {
    // Keep all hints that are in both old and new
    const toKeep = oldHints.filter((oldHint) =>
      newHints.some((newHint) => coordsEqual(oldHint.start, newHint.start) && coordsEqual(oldHint.end, newHint.end)),
    );
    // Add all hints that are in new but not in old
    const toAdd = newHints.filter(
      (newHint) =>
        !toKeep.some((oldHint) => coordsEqual(oldHint.start, newHint.start) && coordsEqual(oldHint.end, newHint.end)),
    );
    // (implicit) Remove all hints that are in old but not in new

    const merged = [...toKeep, ...toAdd];
    merged.sort(compareFn);
    return merged;
  }

  const across = mergeHintArray(oldHints.across, newHints.across, (a, b) => {
    if (a.start.row !== b.start.row) {
      return a.start.row - b.start.row;
    }
    return a.start.col - b.start.col;
  });
  const down = mergeHintArray(oldHints.down, newHints.down, (a, b) => {
    if (a.start.col !== b.start.col) {
      return a.start.col - b.start.col;
    }
    return a.start.row - b.start.row;
  });
  return { across, down };
}

function annotateHints(hints: BaseHints): AnnotatedHints {
  function hintPos(hint: BaseHint): string {
    return JSON.stringify(hint.start);
  }

  const combinedHints = [...hints.across, ...hints.down];
  combinedHints.sort((a, b) => {
    return a.start.row - b.start.row || a.start.col - b.start.col;
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

// TODO: Move somewhere else
export function initCrossword(rows: number, cols: number): Crossword {
  const cells: EmptyCellValue[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' })),
  );
  return {
    cells,
    hints: annotateHints(computeHints(cells)),
  };
}

function cursorIncr(crossword: Crossword, cursor: Cursor, controls: Controls, value: -1 | 1): Cursor {
  // TODO: skip over blocked cells?
  const { rows, cols } = dims(crossword);
  if (controls.direction === 'horizontal') {
    return {
      row: cursor.row,
      col: clamp(cursor.col + value, 0, cols - 1),
    };
  } else {
    return {
      row: clamp(cursor.row + value, 0, rows - 1),
      col: cursor.col,
    };
  }
}

function controllerNext(crossword: Crossword, controller: ControllerState, input: DirectionalCommand): ControllerState {
  if (input === 'switch') {
    return { ...controller, controls: { direction: toggleDirection(controller.controls.direction) } };
  }
  const value = input === 'next' ? 1 : -1;
  return { ...controller, cursor: cursorIncr(crossword, controller.cursor, controller.controls, value) };
}

// Create the context
const CrosswordAppContext = createContext<CrosswordApplicationState | undefined>(undefined);

// TODO: Make accept crossword dimensions
// TODO: Optioally allow highlighting blocked cells (for the builder)
export function CrosswordApplicationProvider({
  children,
  initialCrossword,
}: Readonly<{ children: ReactNode; initialCrossword: Crossword }>) {
  // TODO: use localstorage as backing for crossword. Add a clear button to complete reset state
  const [crossword, setCrossword] = useState(initialCrossword);
  const [controller, _setController] = useState<ControllerState>({
    // TODO: set cursor to first editable cell
    cursor: { row: 0, col: 0 },
    controls: { direction: 'horizontal' },
  });

  function setCell({ row, col }: Coordinate, value: AnyCell) {
    const newCrossword = structuredClone(crossword);
    if (row < 0 || row >= dims(newCrossword).rows || col < 0 || col >= dims(newCrossword).cols) {
      console.error('Invalid cell coordinates:', row, col);
      return;
    }
    newCrossword.cells[row]![col]! = value;
    newCrossword.hints = annotateHints(mergeHints(crossword.hints, computeHints(newCrossword.cells)));
    setCrossword(newCrossword);
  }

  function handleInput(input: AnyInput) {
    if (input.type === 'directional') {
      const command = convertDirectionalCommand(controller.controls, input);
      const newController = controllerNext(crossword, controller, command);
      _setController(newController);
    } else if (input.type === 'value') {
      const { row, col } = controller.cursor;
      // Prevent writing to blocked cells
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell({ row, col }, { type: 'user', value: input.value });
      _setController(controllerNext(crossword, controller, 'next'));
    } else if (input.type === 'delete') {
      setCell(controller.cursor, { type: 'empty' });
      _setController(controllerNext(crossword, controller, 'prev'));
    }
  }

  function setController(coords: Coordinate, direction: Direction) {
    _setController({ cursor: coords, controls: { direction } });
  }

  function setHint(direction: 'across' | 'down', index: number, label: string) {
    const newCrossword = structuredClone(crossword);
    if (direction === 'across') {
      if (index < 0 || index >= newCrossword.hints.across.length) {
        console.error(`Invalid across hint index: ${index}`);
        return;
      }
      newCrossword.hints.across[index]!.label = label;
    }
    if (direction === 'down') {
      if (index < 0 || index >= newCrossword.hints.down.length) {
        console.error(`Invalid down hint index: ${index}`);
        return;
      }
      newCrossword.hints.down[index]!.label = label;
    }
    setCrossword(newCrossword);
  }

  return (
    <CrosswordAppContext.Provider
      value={{
        crossword,
        controller,
        setCell,
        handleInput,
        setController,
        setHint,
      }}
    >
      {children}
    </CrosswordAppContext.Provider>
  );
}

export const useCrosswordApplicationContext = (): CrosswordApplicationState => {
  const context = useContext(CrosswordAppContext);
  if (!context) {
    throw new Error('useCrosswordApplicationContext must be used within an CrosswordApplicationProvider');
  }
  return context;
};
