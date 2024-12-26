import { AnnotatedHints, AnyCell, Dimensions, dims, getCursorRun, getHintNumberForCoordinate } from '~/lib/crossword';
import { CellLogic } from './Cell';
import { ControllerState, Coordinate, Direction } from '~/lib/controls';
import { useEffect, useRef } from 'react';

interface CellGridProps {
  dimensions: Dimensions;
  cells: AnyCell[][];
  hints: AnnotatedHints;
  controller: ControllerState;
  setController: (coords: Coordinate, direction: Direction) => void;
}

// TODO: Instead of hardcoding cell size, make cells fill the space the grid is given, maybe with some minimum size
function CellGrid({ cells, hints, controller, setController }: CellGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { cols } = dims(cells);

  // Manually focus the grid on mount as autoFocus doesn't work on navigation, dialogs
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={1}
      autoFocus
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoColumns: 'min-content',
        border: '2px solid black',
        width: 'fit-content',
      }}
    >
      {cells.flatMap((row, i) =>
        row.map((cell, j) => (
          <CellLogic
            key={`${i}/${j}`}
            cell={cell}
            coordinates={{ row: i, col: j }}
            controller={controller}
            setController={setController}
            cursorRun={getCursorRun(cells, controller)}
            hintNumber={getHintNumberForCoordinate(hints, { row: i, col: j })}
          />
        )),
      )}
    </div>
  );
}

export default CellGrid;
