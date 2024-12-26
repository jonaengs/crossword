import { ReactNode, createContext, useContext, useState } from 'react';
import { ControllerState, Coordinate, Direction, controllerNext, convertDirectionalCommand } from '../lib/controls';
import { BuilderCell, EditableCrossword, annotateHints, computeHints, dims, mergeHints } from '../lib/crossword';
import { AnyInput } from '../lib/input';

interface CrosswordEditorState {
  crossword: EditableCrossword;
  controller: ControllerState;
  setCell: (coords: Coordinate, value: BuilderCell) => void;
  handleInput: (input: AnyInput) => void;
  setController: (coords: Coordinate, direction: Direction) => void;
  setHint: (direction: 'across' | 'down', index: number, label: string) => void;
}

const CrosswordEditorApplicationContext = createContext<CrosswordEditorState | undefined>(undefined);

export function CrosswordEditorApplicationProvider({
  children,
  initialCrossword,
}: Readonly<{ children: ReactNode; initialCrossword: EditableCrossword }>) {
  // TODO: use localstorage as backing for crossword. Add a clear button to complete reset state
  const [crossword, setCrossword] = useState(initialCrossword);
  const [controllerState, setControllerState] = useState<ControllerState>({
    cursor: { row: 0, col: 0 },
    controls: { direction: 'horizontal' },
  });

  function setCell({ row, col }: Coordinate, value: BuilderCell) {
    const crosswordDims = dims(initialCrossword.cells);
    if (row < 0 || row >= crosswordDims.rows || col < 0 || col >= crosswordDims.cols) {
      console.error('Invalid cell coordinates:', row, col);
      return;
    }

    setCrossword((crossword) => {
      const newCrossword = structuredClone(crossword);
      newCrossword.cells[row]![col]! = value;
      newCrossword.hints = annotateHints(mergeHints(newCrossword.hints, computeHints(newCrossword.cells)));
      return newCrossword;
    });
  }

  function handleInput(input: AnyInput) {
    if (input.type === 'directional') {
      const command = convertDirectionalCommand(controllerState.controls, input);
      const newController = controllerNext(crossword.cells, controllerState, command);
      setControllerState(newController);
    } else if (input.type === 'value') {
      const { row, col } = controllerState.cursor;
      // Prevent writing to blocked cells
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell({ row, col }, { type: 'user', value: input.value });
      setControllerState(controllerNext(crossword.cells, controllerState, 'next'));
    } else if (input.type === 'delete') {
      const { row, col } = controllerState.cursor;
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell(controllerState.cursor, { type: 'empty' });
      setControllerState(controllerNext(crossword.cells, controllerState, 'prev'));
    }
  }

  function setController(coords: Coordinate, direction: Direction) {
    setControllerState({ cursor: coords, controls: { direction } });
  }

  function setHint(direction: 'across' | 'down', index: number, text: string) {
    const newCrossword = structuredClone(crossword);
    if (direction === 'across') {
      if (index < 0 || index >= newCrossword.hints.across.length) {
        console.error(`Invalid across hint index: ${index}`);
        return;
      }
    }
    if (direction === 'down') {
      if (index < 0 || index >= newCrossword.hints.down.length) {
        console.error(`Invalid down hint index: ${index}`);
        return;
      }
    }
    setCrossword((crossword) => {
      const newCrossword = structuredClone(crossword);
      newCrossword.hints[direction][index]!.text = text;
      return newCrossword;
    });
  }

  return (
    <CrosswordEditorApplicationContext.Provider
      value={{
        crossword,
        controller: controllerState,
        setCell,
        handleInput,
        setController,
        setHint,
      }}
    >
      {children}
    </CrosswordEditorApplicationContext.Provider>
  );
}

export const useCrosswordEditorApplicationContext = (): CrosswordEditorState => {
  const context = useContext(CrosswordEditorApplicationContext);
  if (!context) {
    throw new Error('useCrosswordApplicationContext must be used within an CrosswordApplicationProvider');
  }
  return context;
};
