import { useEffect, useRef } from 'react';
import { CrosswordApplicationProvider, useCrosswordApplicationContext } from '~/lib/context';
import { ControllerState, Coordinate } from '~/lib/controls';
import { AnyCell } from '~/lib/crossword';
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

function BaseCell({ value, color, hintNumber, onClick, highlighted, active }: BaseCellProps) {
  return (
    <div
      className={cn('flex items-end justify-center relative', 'size-16 border-gray-600 border bg-white uppercase', {
        'bg-blue-100': highlighted,
        'bg-yellow-200': active,
        'bg-black': color === 'black',
        'bg-yellow-950': color === 'black' && active,
      })}
      onClick={onClick}
    >
      {hintNumber && <span className="absolute top-1 left-1">{hintNumber}</span>}
      <span className="text-2xl">{value}</span>
    </div>
  );
}

function CellLogic({
  cell,
  coordinates,
  controller,
  hintNumber,
  setActive,
}: {
  cell: AnyCell;
  coordinates: Coordinate;
  controller: ControllerState;
  hintNumber: string | null;
  setActive: () => void;
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
      onClick={setActive}
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

function BuilderApplication() {
  return (
    <CrosswordApplicationProvider>
      <Builder />;
    </CrosswordApplicationProvider>
  );
}

function Builder() {
  const { crossword, controller, handleInput, onCellClick, setHint } = useCrosswordApplicationContext();
  const keyboardCaptureAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = keyboardCaptureAreaRef.current;
    if (!element) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      console.log({ event });
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

  const hintAcross = crossword.hints.across.find((hint) => {
    const isRow = hint.start.row === controller.cursor.row;
    const isCol = hint.start.col <= controller.cursor.col && hint.end.col >= controller.cursor.col;
    return isRow && isCol;
  });
  const hintDown = crossword.hints.down.find((hint) => {
    const isCol = hint.start.col === controller.cursor.col;
    const isRow = hint.start.row <= controller.cursor.row && hint.end.row >= controller.cursor.row;
    return isCol && isRow;
  });

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
                setActive={() => onCellClick({ row: i, col: j })}
                hintNumber={getHintNumberForCoordinate({ row: i, col: j })}
              />
            )),
          )}
        </div>
      </div>
      {/* Hints */}
      <div className="flow-col gap-4 mt-6">
        <h4 className="font-bold">Across</h4>
        <ol className="list-decimal">
          {crossword.hints.across.map((hint, i) => (
            <li
              className={cn(
                'list-inside',
                hint === hintAcross && controller.controls.direction === 'horizontal' && 'bg-blue-200',
              )}
            >
              <input
                type="text"
                key={hint.start.col}
                value={hint.label}
                placeholder="hint"
                onChange={(event) => setHint('across', i, event.target.value)}
              />
            </li>
          ))}
        </ol>
        <h4 className="font-bold">Down</h4>
        <ol className="list-decimal">
          {crossword.hints.down.map((hint, i) => (
            <li
              className={cn(
                'list-inside',
                hint === hintDown && controller.controls.direction === 'vertical' && 'bg-blue-200',
              )}
            >
              <input
                type="text"
                key={hint.start.col}
                value={hint.label}
                placeholder="hint"
                onChange={(event) => setHint('down', i, event.target.value)}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default BuilderApplication;
