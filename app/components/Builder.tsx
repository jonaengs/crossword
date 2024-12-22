import { useEffect } from 'react';
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
  onClick: () => void;
  highlighted?: boolean;
  active?: boolean;
}

function BaseCell({ value, color, onClick, highlighted, active }: BaseCellProps) {
  return (
    <span
      className={cn('flex items-center justify-center', 'size-24 border-gray-600 border bg-white uppercase', {
        'bg-blue-100': highlighted,
        'bg-yellow-200': active,
        'bg-black': color === 'black',
      })}
      onClick={onClick}
      tabIndex={1}
    >
      {value}
    </span>
  );
}

function CellLogic({
  cell,
  coordinates,
  controller,
  setActive,
}: {
  cell: AnyCell;
  coordinates: Coordinate;
  controller: ControllerState;
  setActive: () => void;
}) {
  // TODO: Make repeat cell click change controller direction
  const { type } = cell;
  const color = type === 'blocked' ? 'black' : 'white';
  console.log({ color });
  const value = 'value' in cell ? cell.value : null;
  const isActive = controller.cursor.row === coordinates.row && controller.cursor.col === coordinates.col;
  const isHighlighted =
    controller.controls.direction === 'horizontal'
      ? controller.cursor.row === coordinates.row
      : controller.cursor.col === coordinates.col;
  return <BaseCell color={color} value={value} highlighted={isHighlighted} active={isActive} onClick={setActive} />;
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
  const { crossword, controller, handleInput, onCellClick } = useCrosswordApplicationContext();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const input = translateKeyboardInput(event);
      if (input === null) {
        return;
      }
      event.preventDefault();
      handleInput(input);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Toolbar />
      <div className="inline-grid grid-cols-5 auto-cols-min">
        {crossword.cells.flatMap((row, i) =>
          row.map((cell, j) => (
            <CellLogic
              key={`${i}/${j}`}
              cell={cell}
              coordinates={{ row: i, col: j }}
              controller={controller}
              setActive={() => onCellClick({ row: i, col: j })}
            />
          )),
        )}
      </div>
    </div>
  );
}

export default BuilderApplication;
