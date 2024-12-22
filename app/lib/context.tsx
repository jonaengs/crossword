import { ReactNode, createContext, useContext, useState } from 'react';
import { AnyCell, CrossWord, EmptyCellValue } from './crossword';
import {
  ControllerState,
  Controls,
  Coordinate,
  Cursor,
  Direction,
  DirectionalCommand,
  convertDirectionalCommand,
} from './controls';
import { AnyInput } from './input';
import { clamp } from './numbers';

interface CrosswordApplicationState {
  crossword: CrossWord;
  setCell: (coords: Coordinate, value: AnyCell) => void;
  controller: ControllerState;
  handleInput: (input: AnyInput) => void;
  onCellClick: (coords: Coordinate) => void;
}

function dims(crossword: CrossWord): { rows: number; cols: number } {
  return { rows: crossword.cells.length, cols: crossword.cells[0]?.length ?? 0 };
}

function initCrossword(rows: number, cols: number): CrossWord {
  const cells: EmptyCellValue[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' })),
  );
  return {
    cells,
  };
}

function cursorIncr(crossword: CrossWord, cursor: Cursor, controls: Controls, value: -1 | 1): Cursor {
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

function controllerNext(crossword: CrossWord, controller: ControllerState, input: DirectionalCommand): ControllerState {
  function toggleDirection(direction: Direction): Direction {
    return direction === 'horizontal' ? 'vertical' : 'horizontal';
  }

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
export function CrosswordApplicationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [rows, cols] = [5, 5];
  const [crossword, setCrossword] = useState(initCrossword(rows, cols));
  const [controller, setController] = useState<ControllerState>({
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
    setCrossword(newCrossword);
  }

  function handleInput(input: AnyInput) {
    if (input.type === 'directional') {
      const command = convertDirectionalCommand(controller.controls, input);
      const newController = controllerNext(crossword, controller, command);
      setController(newController);
    } else if (input.type === 'value') {
      const { row, col } = controller.cursor;
      // Prevent writing to blocked cells
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell({ row, col }, { type: 'user', value: input.value });
      setController(controllerNext(crossword, controller, 'next'));
    } else if (input.type === 'delete') {
      setCell(controller.cursor, { type: 'empty' });
      setController(controllerNext(crossword, controller, 'prev'));
    }
  }

  function onCellClick({ row, col }: Coordinate) {
    setController({ ...controller, cursor: { row, col } });
  }

  return (
    <CrosswordAppContext.Provider
      value={{
        crossword,
        controller,
        setCell,
        handleInput,
        onCellClick,
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
