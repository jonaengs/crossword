import { useEffect, useState } from 'react';
import { MovementInput, translateKeyboardInput } from '~/lib/input';
import { clamp } from '~/lib/numbers';
import { cn } from '~/lib/style';

// TODO: Convert into a class
interface CrossWord {
  /** Row major */
  cells: AnyCell[][];
  dims: () => { rows: number; cols: number };
}

interface Coordinate {
  row: number;
  col: number;
}

type DirectionalCommand = 'next' | 'prev' | 'switch';
type Direction = 'horizontal' | 'vertical';

interface Controls {
  direction: Direction;
}

interface Cursor extends Coordinate {}

interface ControllerState {
  cursor: Cursor;
  controls: Controls;
}

function convertDirectionalCommand(controls: Controls, command: MovementInput): DirectionalCommand {
  if (controls.direction === 'horizontal') {
    switch (command.value) {
      case 'left':
        return 'prev';
      case 'right':
        return 'next';
      default:
        return 'switch';
    }
  } else {
    switch (command.value) {
      case 'up':
        return 'prev';
      case 'down':
        return 'next';
      default:
        return 'switch';
    }
  }
}

function cursorIncr(crossword: CrossWord, cursor: Cursor, controls: Controls, value: -1 | 1): Cursor {
  // TODO: skip over blocked cells?
  const { rows, cols } = crossword.dims();
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

function initCrossword(rows: number, cols: number): CrossWord {
  const cells: EmptyCellValue[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' })),
  );
  return {
    cells,
    dims: () => ({ rows, cols }),
  };
}

interface BaseCellProps {
  color: 'black' | 'white';
  value: string | null;
  highlighted?: boolean;
  active?: boolean;
}

function BaseCell({ value, color, highlighted, active }: BaseCellProps) {
  return (
    <span
      className={cn(
        'flex items-center justify-center',
        'size-10 border-gray-600 border bg-white uppercase',
        highlighted && 'bg-blue-100',
        active && 'bg-yellow-200',
        color === 'black' && 'bg-black',
      )}
      tabIndex={1}
    >
      {value}
    </span>
  );
}

function CellController({
  cell,
  coordinates,
  controller,
}: {
  cell: AnyCell;
  coordinates: Coordinate;
  controller: ControllerState;
}) {
  const { type } = cell;
  const color = type === 'blocked' ? 'black' : 'white';
  const value = 'value' in cell ? cell.value : null;
  const isActive = controller.cursor.row === coordinates.row && controller.cursor.col === coordinates.col;
  const isHighlighted =
    controller.controls.direction === 'horizontal'
      ? controller.cursor.row === coordinates.row
      : controller.cursor.col === coordinates.col;
  return <BaseCell color={color} value={value} highlighted={isHighlighted} active={isActive} />;
}

function Builder() {
  const [rows, cols] = [5, 5];
  const [crossword, setCrossword] = useState(initCrossword(rows, cols));
  const [controller, setController] = useState<ControllerState>({
    // TODO: set cursor to first editable cell
    cursor: { row: 0, col: 0 },
    controls: { direction: 'horizontal' },
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const input = translateKeyboardInput(event);
      if (input === null) {
        return;
      }
      event.preventDefault();
      console.log(input);
      if (input.type === 'directional') {
        const command = convertDirectionalCommand(controller.controls, input);
        const newController = controllerNext(crossword, controller, command);
        setController(newController);
      } else if (input.type === 'value') {
        const { row, col } = controller.cursor;
        crossword.cells[row]![col]! = { type: 'user', value: input.value };
        setCrossword(crossword);
        // After a successful input, we move to the next cell
        const newController = controllerNext(crossword, controller, 'next');
        setController(newController);
      } else if (input.type === 'delete') {
        const { row, col } = controller.cursor;
        crossword.cells[row]![col]! = { type: 'empty' };
        setCrossword(crossword);
        // After a successful delete, we move to the previous cell
        const newController = controllerNext(crossword, controller, 'prev');
        setController(newController);
      }
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="inline-grid grid-cols-5 auto-cols-min -translate-y-1/2">
        {crossword.cells.flatMap((row, i) =>
          row.map((cell, j) => (
            <CellController key={`${i}/${j}`} cell={cell} coordinates={{ row: i, col: j }} controller={controller} />
          )),
        )}
      </div>
    </div>
  );
}

export default Builder;
