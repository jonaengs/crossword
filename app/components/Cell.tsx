import { ControllerState, Coordinate, Direction, toggleDirection } from '~/lib/controls';
import { AnyCell, Run, coordsEqual, isInRun } from '~/lib/crossword';
import { cn } from '~/lib/style';

interface BaseCellProps {
  color: 'black' | 'white';
  value: string | null;
  hintNumber: string | null;
  onClick: () => void;
  confirmedCorrect: boolean;
  confirmedIncorrect: boolean;
  wasCorrected: boolean;
  highlighted?: boolean;
  active?: boolean;
}

function BaseCell({
  value,
  color,
  hintNumber,
  onClick,
  confirmedCorrect,
  confirmedIncorrect,
  wasCorrected,
  highlighted,
  active,
}: BaseCellProps) {
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
        // Note: incorrect-cell and corrected-cell are custom css classes. See styles.css
        confirmedIncorrect && 'incorrect-cell',
        wasCorrected && 'corrected-cell',
      )}
      onClick={onClick}
    >
      {hintNumber && <span className="absolute top-1 left-1">{hintNumber}</span>}
      {/* TODO: Increase font size slightly (but less than 5xl, unless we also increase cell size) */}
      <span className={cn('text-4xl', confirmedCorrect && 'text-blue-500')}>{value}</span>
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
      confirmedCorrect={(cell.type === 'checked' && cell.correct) || cell.type === 'revealed'}
      confirmedIncorrect={cell.type === 'checked' && !cell.correct}
      wasCorrected={cell.type === 'revealed' && cell.value !== cell.prevValue}
    />
  );
}
