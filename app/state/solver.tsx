import { ReactNode, createContext, useContext, useState } from 'react';
import { ControllerState, Coordinate, Direction, controllerNext, convertDirectionalCommand } from '../lib/controls';
import { AnnotatedHints, BuilderCell, EditableCrossword, AnyCell, dims, findFirstNonblocked } from '../lib/crossword';
import { AnyInput } from '../lib/input';

interface CrosswordSolverState {
  cells: AttemptCells;
  hints: AnnotatedHints;
  controller: ControllerState;
  handleInput: (input: AnyInput) => void;
  setController: (coords: Coordinate, direction: Direction) => void;
  isCompleted: boolean;
}

const CrosswordSolverApplicationContext = createContext<CrosswordSolverState | undefined>(undefined);

type AttemptCells = AnyCell[][];

/** Preserves the structure of the solution, replacing all non-blocked cells with empty cells */
function initAttemptCells(solution: BuilderCell[][]): AttemptCells {
  return solution.map((row) => row.map((cell) => (cell.type === 'blocked' ? cell : { type: 'empty' })));
}

export function CrosswordSolverApplicationProvider({
  children,
  initialCrossword: { cells: solution, hints },
}: Readonly<{ children: ReactNode; initialCrossword: EditableCrossword }>) {
  // TODO: use localstorage as backing for crossword. Add a clear button to complete reset state
  const [attempt, setAttempt] = useState<AttemptCells>(initAttemptCells(solution));
  const [isCompleted, setIsCompleted] = useState(false);
  const [controller, _setController] = useState<ControllerState>({
    // TODO: set cursor to first editable cell
    cursor: { row: 0, col: findFirstNonblocked(attempt, { axis: 'col', index: 0 }) ?? 0 },
    controls: { direction: 'horizontal' },
  });

  function setCell({ row, col }: Coordinate, value: BuilderCell) {
    const netAttempt = structuredClone(attempt);
    netAttempt[row]![col]! = value;
    setAttempt(netAttempt);
  }

  function handleInput(input: AnyInput) {
    if (input.type === 'directional') {
      const command = convertDirectionalCommand(controller.controls, input);
      const newController = controllerNext(attempt, controller, command);
      const { row, col } = newController.cursor;
      if (attempt[row]![col]!.type === 'blocked') {
        return;
      }
      _setController(newController);
    } else if (input.type === 'value') {
      const { row, col } = controller.cursor;
      if (attempt[row]![col]!.type === 'blocked') {
        return;
      }
      setCell({ row, col }, { type: 'user', value: input.value });
      const newController = controllerNext(attempt, controller, 'next');
      if (attempt[newController.cursor.row]![newController.cursor.col]!.type === 'blocked') {
        return;
      }
      _setController(newController);
    } else if (input.type === 'delete') {
      const { row, col } = controller.cursor;
      if (attempt[row]![col]!.type === 'blocked') {
        return;
      }
      setCell(controller.cursor, { type: 'empty' });
      _setController(controllerNext(attempt, controller, 'prev'));
    }
  }

  function setController(coords: Coordinate, direction: Direction) {
    _setController({ cursor: coords, controls: { direction } });
  }

  function computeIsCompleted() {
    const crosswordDims = dims(solution);
    for (let i = 0; i < crosswordDims.rows; i++) {
      for (let j = 0; j < crosswordDims.cols; j++) {
        const attemptCell = attempt[i]![j]!;
        const solutionCell = solution[i]![j]!;
        if (JSON.stringify(attemptCell) !== JSON.stringify(solutionCell)) {
          return false;
        }
      }
    }
    return true;
  }
  if (!isCompleted && computeIsCompleted()) {
    setIsCompleted(true);
  }

  return (
    <CrosswordSolverApplicationContext.Provider
      value={{
        cells: attempt,
        hints,
        controller,
        handleInput,
        setController,
        isCompleted,
      }}
    >
      {children}
    </CrosswordSolverApplicationContext.Provider>
  );
}

export const useCrosswordSolverApplicationContext = (): CrosswordSolverState => {
  const context = useContext(CrosswordSolverApplicationContext);
  if (!context) {
    throw new Error('useCrosswordApplicationContext must be used within an CrosswordApplicationProvider');
  }
  return context;
};
