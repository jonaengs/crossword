import { ControllerState, Coordinate, Direction, toggleDirection } from '~/lib/controls';
import { AnyCell, Run, coordsEqual, isInRun } from '~/lib/crossword';
import { cn } from '~/lib/style';

export interface BaseCellProps {
  color: 'black' | 'white';
  value: string | null;
  hintNumber: string | null;
  onClick: () => void;
  highlighted?: boolean;
  active?: boolean;
}

export function BaseCell({ value, color, hintNumber, onClick, highlighted, active }: BaseCellProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-center relative',
        'size-16 bg-white outline-gray-700 outline outline-1 uppercase',
        'cursor-default select-none',
        {
          'bg-blue-100': highlighted,
          'bg-yellow-200': active,
          'bg-black': color === 'black',
          'bg-yellow-900': color === 'black' && active,
        },
      )}
      onClick={onClick}
    >
      {hintNumber && <span className="absolute top-1 left-1">{hintNumber}</span>}
      <span className="text-4xl">{value}</span>
    </div>
  );
}

export interface CellLogicProps {
  cell: AnyCell;
  coordinates: Coordinate;
  hintNumber: string | null;
  controller: ControllerState;
  cursorRun: Run;
  setController: (coords: Coordinate, direction: Direction) => void;
}

export function CellLogic({ cell, coordinates, controller, hintNumber, cursorRun, setController }: CellLogicProps) {
  const color = cell.type === 'blocked' ? 'black' : 'white';
  const value = 'value' in cell ? cell.value : null;
  const isActive = controller.cursor.row === coordinates.row && controller.cursor.col === coordinates.col;
  const isHighlighted = isInRun(coordinates, cursorRun);
  const controllerDirection = controller.controls.direction;
  return (
    <BaseCell
      color={color}
      value={value}
      highlighted={isHighlighted}
      active={isActive}
      onClick={() =>
        setController(
          coordinates,
          coordsEqual(controller.cursor, coordinates) ? toggleDirection(controllerDirection) : controllerDirection,
        )
      }
      hintNumber={hintNumber}
    />
  );
}
