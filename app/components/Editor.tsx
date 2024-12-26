import { useRef } from 'react';
import { AnnotatedHint, dims, isCursorInHintRun } from '~/lib/crossword';
import useOnKeyboardInput from '~/lib/hooks/useOnKeyboardInput';
import { cn } from '~/lib/style';
import { useCrosswordEditorApplicationContext } from '~/state/editor';
import CellGrid from './CellGrid';

// TODO: Move Editor and Solver files somewhere else as they are not reusable without being wrapped in the correct context provider

/**
 * TODO:
 * Word suggestor
 * Add the following to cells: their number (across/down), their coordinates
 *  - Perhaps introducing a new wrapper around the cells (ContextualizedCell<T extends AnyCell> for example)
 */

function Toolbar() {
  /**
   * Functionality:
   * word search
   */

  const {
    crossword,
    setCell,
    controller: { cursor },
  } = useCrosswordEditorApplicationContext();

  const cell = crossword.cells[cursor.row]![cursor.col]!;
  const isBlocked = cell.type === 'blocked';
  const isClearable = cell.type !== 'empty';

  function toggleBlocked() {
    if (isBlocked) {
      setCell({ row: cursor.row, col: cursor.col }, { type: 'empty' });
    } else {
      setCell({ row: cursor.row, col: cursor.col }, { type: 'blocked' });
    }
  }

  function clear() {
    setCell({ row: cursor.row, col: cursor.col }, { type: 'empty' });
  }

  return (
    <div className="flex flex-row gap-2">
      <button onClick={toggleBlocked}>{isBlocked ? 'Unblock' : 'Block'}</button>
      <button onClick={clear} disabled={!isClearable}>
        Clear
      </button>
    </div>
  );
}

function EditableHintsList({ direction, mayHighlight }: { direction: 'across' | 'down'; mayHighlight: boolean }) {
  const { crossword, controller, setHint, setController } = useCrosswordEditorApplicationContext();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hints = crossword.hints[direction];

  // If the list may highlight a hint, find the hint whose run the controller's cursor lies within
  const hintOnCursor: AnnotatedHint | null =
    (mayHighlight && hints.find((hint) => isCursorInHintRun(hint, controller.cursor))) || null;

  // On focusin a hint, set the controller's cursor to the startint cell of the hint's run
  function onFocusHint(hint: AnnotatedHint) {
    setController(hint.run.start, hint.direction === 'across' ? 'horizontal' : 'vertical');
  }

  function onLabelClick(idx: number) {
    const ref = inputRefs.current[idx];
    if (ref) {
      ref.focus();
    }
  }

  return (
    <>
      <h4 className="font-bold title">{direction}</h4>
      <div className="flex flex-col gap-1">
        {hints.map((hint, i) => (
          <li
            key={i}
            className={cn('flex items-start', hint === hintOnCursor && 'bg-blue-200')}
            onFocus={() => onFocusHint(hint)}
          >
            <span className="mr-1 w-6 text-right cursor-pointer" onClick={() => onLabelClick(i)}>
              {hint.index}.
            </span>
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
                return () => {
                  inputRefs.current[i] = null;
                };
              }}
              type="text"
              value={hint.text}
              placeholder="hint"
              className="bg-inherit"
              onChange={(event) => setHint(direction, i, event.target.value)}
            />
          </li>
        ))}
      </div>
    </>
  );
}

function Editor() {
  const { crossword, controller, handleInput, setController } = useCrosswordEditorApplicationContext();
  const controllerDirection = controller.controls.direction;
  const keyboardCaptureAreaRef = useRef<HTMLDivElement>(null);

  useOnKeyboardInput(handleInput, keyboardCaptureAreaRef);

  // TODO: Add preview button that opens the crossword up in the solver inside a dialog or something like that
  return (
    <div className="flex flex-row justify-center gap-4">
      {/* Crossword */}
      <div className="flex flex-col items-center" ref={keyboardCaptureAreaRef}>
        <Toolbar />
        <CellGrid
          dimensions={dims(crossword.cells)}
          cells={crossword.cells}
          hints={crossword.hints}
          controller={controller}
          setController={setController}
        />
      </div>
      {/* Hints */}
      <div className="flow-col gap-4 mt-6">
        <EditableHintsList direction="across" mayHighlight={controllerDirection === 'horizontal'} />
        <EditableHintsList direction="down" mayHighlight={controllerDirection === 'vertical'} />
      </div>
    </div>
  );
}

export default Editor;
