import { useEffect, useRef } from 'react';
import { useCrosswordApplicationContext } from '~/lib/context';
import { ControllerState, Coordinate, coordsEqual, toggleDirection } from '~/lib/controls';
import { AnnotatedHint, AnyCell } from '~/lib/crossword';
import { translateKeyboardInput } from '~/lib/input';
import { cn } from '~/lib/style';

/**
 * TODO:
 * Word suggestor
 * Add the following to cells: their number (across/down), their coordinates
 *  - Perhaps introducing a new wrapper around the cells (ContextualizedCell<T extends AnyCell> for example)
 */

interface BaseCellProps {
  color: 'black' | 'white';
  value: string | null;
  hintNumber: string | null;
  onClick: () => void;
  highlighted?: boolean;
  active?: boolean;
}

// TODO: Make text not select/highlightable
function BaseCell({ value, color, hintNumber, onClick, highlighted, active }: BaseCellProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-center relative',
        'size-16 border-gray-600 border bg-white uppercase',
        'cursor-default select-none',
        {
          'bg-blue-100': highlighted,
          'bg-yellow-200': active,
          'bg-black': color === 'black',
          'bg-yellow-950': color === 'black' && active,
        },
      )}
      onClick={onClick}
    >
      {hintNumber && <span className="absolute top-1 left-1">{hintNumber}</span>}
      <span className="text-4xl">{value}</span>
    </div>
  );
}

function CellLogic({
  cell,
  coordinates,
  controller,
  hintNumber,
  onClick,
}: {
  cell: AnyCell;
  coordinates: Coordinate;
  controller: ControllerState;
  hintNumber: string | null;
  onClick: () => void;
}) {
  // TODO: Make repeat cell click change controller direction
  const { type } = cell;
  const color = type === 'blocked' ? 'black' : 'white';
  const value = 'value' in cell ? cell.value : null;
  const isActive = controller.cursor.row === coordinates.row && controller.cursor.col === coordinates.col;
  const isHighlighted =
    controller.controls.direction === 'horizontal'
      ? controller.cursor.row === coordinates.row
      : controller.cursor.col === coordinates.col;
  return (
    <BaseCell
      color={color}
      value={value}
      highlighted={isHighlighted}
      active={isActive}
      onClick={onClick}
      hintNumber={hintNumber}
    />
  );
}

function Toolbar() {
  /**
   * Functionality:
   * word search
   */

  const {
    crossword,
    setCell,
    controller: { cursor },
  } = useCrosswordApplicationContext();

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

function HintsList({ direction, mayHighlight }: { direction: 'across' | 'down'; mayHighlight: boolean }) {
  const { crossword, controller, setHint, setController } = useCrosswordApplicationContext();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const hints = direction === 'across' ? crossword.hints.across : crossword.hints.down;
  // If the list may highlight a hint, find the hint whose run the controller's cursor lies within
  const hintOnCursor: AnnotatedHint | null =
    (mayHighlight &&
      hints.find((hint) => {
        const isRow = hint.start.row <= controller.cursor.row && hint.end.row >= controller.cursor.row;
        const isCol = hint.start.col <= controller.cursor.col && hint.end.col >= controller.cursor.col;
        return isRow && isCol;
      })) ||
    null;

  // On focusin a hint, set the controller's cursor to the startint cell of the hint's run
  function onFocusHint(hint: AnnotatedHint) {
    setController(hint.start, hint.direction === 'across' ? 'horizontal' : 'vertical');
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
            key={JSON.stringify(hint.start)}
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
              key={hint.start.col}
              value={hint.label}
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

function Builder() {
  const { crossword, controller, handleInput, setController } = useCrosswordApplicationContext();
  const controllerDirection = controller.controls.direction;
  const keyboardCaptureAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = keyboardCaptureAreaRef.current;
    if (!element) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      const input = translateKeyboardInput(event);
      if (input === null) {
        return;
      }
      event.preventDefault();
      handleInput(input);
    }
    element.addEventListener('keydown', onKeyDown);
    return () => {
      element.removeEventListener('keydown', onKeyDown);
    };
  }, [handleInput, keyboardCaptureAreaRef]);

  function getHintNumberForCoordinate({ row, col }: Coordinate): string | null {
    const hintAcross = crossword.hints.across.find((hint) => hint.start.row === row && hint.start.col == col);
    const hintDown = crossword.hints.down.find((hint) => hint.start.row === row && hint.start.col == col);
    return hintDown?.index.toString() || hintAcross?.index.toString() || null;
  }

  return (
    <div className="flex flex-row justify-center gap-4">
      {/* Crossword */}
      <div className="flex flex-col items-center" ref={keyboardCaptureAreaRef}>
        <Toolbar />
        <div className="inline-grid grid-cols-5 auto-cols-min" tabIndex={1} autoFocus>
          {crossword.cells.flatMap((row, i) =>
            row.map((cell, j) => (
              <CellLogic
                key={`${i}/${j}`}
                cell={cell}
                coordinates={{ row: i, col: j }}
                controller={controller}
                onClick={() =>
                  setController(
                    { row: i, col: j },
                    coordsEqual(controller.cursor, { row: i, col: j })
                      ? toggleDirection(controllerDirection)
                      : controllerDirection,
                  )
                }
                hintNumber={getHintNumberForCoordinate({ row: i, col: j })}
              />
            )),
          )}
        </div>
      </div>
      {/* Hints */}
      <div className="flow-col gap-4 mt-6">
        <HintsList direction="across" mayHighlight={controllerDirection === 'horizontal'} />
        <HintsList direction="down" mayHighlight={controllerDirection === 'vertical'} />
      </div>
    </div>
  );
}

export default Builder;
