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
  const crosswordDims = dims(initialCrossword.cells);
  const [crossword, setCrossword] = useState(initialCrossword);
  const [controller, _setController] = useState<ControllerState>({
    cursor: { row: 0, col: 0 },
    controls: { direction: 'horizontal' },
  });

  function setCell({ row, col }: Coordinate, value: BuilderCell) {
    const newCrossword = structuredClone(crossword);
    if (row < 0 || row >= crosswordDims.rows || col < 0 || col >= crosswordDims.cols) {
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
      const newController = controllerNext(crosswordDims, controller, command);
      _setController(newController);
    } else if (input.type === 'value') {
      const { row, col } = controller.cursor;
      // Prevent writing to blocked cells
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell({ row, col }, { type: 'user', value: input.value });
      _setController(controllerNext(crosswordDims, controller, 'next'));
    } else if (input.type === 'delete') {
      const { row, col } = controller.cursor;
      if (crossword.cells[row]![col]!.type === 'blocked') {
        return;
      }
      setCell(controller.cursor, { type: 'empty' });
      _setController(controllerNext(crosswordDims, controller, 'prev'));
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
    <CrosswordEditorApplicationContext.Provider
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
