import { useRef } from 'react';
import useOnKeyboardInput from '~/lib/hooks/useOnKeyboardInput';
import { useCrosswordSolverApplicationContext } from '~/state/solver';
import CellGrid from './CellGrid';
import { AnnotatedHint, dims, isCursorInHintRun } from '~/lib/crossword';
import { cn } from '~/lib/style';

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
      <div className="flex flex-col items-center" ref={keyboardCaptureAreaRef}>
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
