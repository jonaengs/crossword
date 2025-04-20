import { useRef } from 'react';
import useOnKeyboardInput from '~/lib/hooks/useOnKeyboardInput';
import { useCrosswordSolverApplicationContext } from '~/state/solver';
import CellGrid from './CellGrid';
import { AnnotatedHint, dims, getCursorRun, getRunCells, isCursorInHintRun } from '~/lib/crossword';
import { cn } from '~/lib/style';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Coordinate } from '~/lib/controls';

// TODO: Make all uses of asChild optional by making it a parameter of the components that use it

/** Assumes children is asChildable */
function SolverDropdown({ children, options }: { children: React.ReactNode; options: React.ReactNode[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white shadow-md w-32 p-2">
          {options.map((opt, i) => (
            <DropdownMenu.Item key={i}> {opt} </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// TODO: Rename Cell -> Square

function Toolbar() {
  const { revealCell, checkCell, controller, cells } = useCrosswordSolverApplicationContext();

  function applyToCell(f: (coord: Coordinate) => void) {
    f(controller.cursor);
  }

  function applyToWord(f: (coord: Coordinate) => void) {
    const currentRun = getCursorRun(cells, controller);
    const runCells = getRunCells(cells, currentRun);
    runCells.forEach(({ coordinates }) => f(coordinates));
  }

  function applyToAll(f: (coord: Coordinate) => void) {
    const crosswordDims = dims(cells);
    for (let row = 0; row < crosswordDims.rows; row++) {
      for (let col = 0; col < crosswordDims.cols; col++) {
        f({ row, col });
      }
    }
  }

  return (
    <div className="flex flex-row gap-2 justify-center w-full">
      <SolverDropdown
        options={[
          <div onClick={() => applyToCell(checkCell)}>Cell</div>,
          <div onClick={() => applyToWord(checkCell)}>Word</div>,
          <div onClick={() => applyToAll(checkCell)}>Puzzle</div>,
        ]}
      >
        <button>Check</button>
      </SolverDropdown>
      <SolverDropdown
        options={[
          <div onClick={() => applyToCell(revealCell)}>Cell</div>,
          <div onClick={() => applyToWord(revealCell)}>Word</div>,
          <div onClick={() => applyToAll(revealCell)}>Puzzle</div>,
        ]}
      >
        <button>Reveal</button>
      </SolverDropdown>
    </div>
  );
}

function HintsList({ direction, mayHighlight }: { direction: 'across' | 'down'; mayHighlight: boolean }) {
  const { hints: allHints, controller, setController } = useCrosswordSolverApplicationContext();
  const hints = allHints[direction];
  const hintOnCursor: AnnotatedHint | null =
    (mayHighlight && hints.find((hint) => isCursorInHintRun(hint, controller.cursor))) || null;

  return (
    <>
      <h4 className="font-bold title">{direction}</h4>
      <div className="flex flex-col gap-1">
        {hints.map((hint, i) => (
          <li
            key={i}
            className={cn('flex items-start', hint === hintOnCursor && 'bg-blue-200')}
            onClick={() => setController(hint.run.start, hint.direction === 'across' ? 'horizontal' : 'vertical')}
          >
            <span className="mr-1 w-6 text-right cursor-pointer">{hint.index}.</span>
            <span>{hint.text}</span>
          </li>
        ))}
      </div>
    </>
  );
}

// TODO: Add check + reveal functionality on a cell, run and puzzle level

function Solver() {
  const { cells, hints, controller, handleInput, setController, isCompleted } = useCrosswordSolverApplicationContext();
  const controllerDirection = controller.controls.direction;
  const keyboardCaptureAreaRef = useRef<HTMLDivElement>(null);

  useOnKeyboardInput(handleInput, keyboardCaptureAreaRef);

  // TODO: Better indication of completion (simple)
  // TODO: somehow get an oncompletion callback going. Show a dialog when complete
  // TODO: Add a timer, stop it when completed and show it in the modal
  return (
    <div className="flex flex-row justify-center gap-4 w-fit">
      {isCompleted && 'COMPLETED!'}
      <div className="flex flex-col gap-2 items-center" ref={keyboardCaptureAreaRef}>
        <Toolbar />
        <CellGrid
          dimensions={dims(cells)}
          cells={cells}
          hints={hints}
          controller={controller}
          setController={setController}
        />
      </div>
      {/* Hints */}
      <div className="flow-col gap-4 mt-6">
        <HintsList direction="across" mayHighlight={controllerDirection === 'horizontal'} />
        <HintsList direction="down" mayHighlight={controllerDirection === 'vertical'} />
      </div>
    </div>
  );
}

export default Solver;
