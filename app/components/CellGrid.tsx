import { AnnotatedHints, AnyCell, Dimensions, getHintNumberForCoordinate } from '~/lib/crossword';
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
  // TODO: Make handle any dimensions
  return (
    <div className="inline-grid grid-cols-5 auto-cols-min" tabIndex={1} autoFocus>
      {cells.flatMap((row, i) =>
        row.map((cell, j) => (
          <CellLogic
            key={`${i}/${j}`}
            cell={cell}
            coordinates={{ row: i, col: j }}
            controller={controller}
            setController={setController}
            hintNumber={getHintNumberForCoordinate(hints, { row: i, col: j })}
          />
        )),
      )}
    </div>
  );
}

export default CellGrid;
