import { AnnotatedHints, AnyCell, Dimensions, dims, getCursorRun, getHintNumberForCoordinate } from '~/lib/crossword';
import { CellLogic } from './Cell';
import { ControllerState, Coordinate, Direction } from '~/lib/controls';

interface CellGridProps {
  dimensions: Dimensions;
  cells: AnyCell[][];
  hints: AnnotatedHints;
  controller: ControllerState;
  setController: (coords: Coordinate, direction: Direction) => void;
}

function CellGrid({ cells, hints, controller, setController }: CellGridProps) {
  const { cols } = dims(cells);
  return (
    <div
      tabIndex={1}
      autoFocus
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoColumns: 'min-content',
        border: '2px solid black',
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
