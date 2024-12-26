import { AnyCell, Dimensions, dims, findFirstNonblocked } from './crossword';
import { MovementInput } from './input';
import { clamp } from './numbers';

export interface Coordinate {
  row: number;
  col: number;
}

export interface Controls {
  direction: Direction;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Cursor extends Coordinate {}

export interface ControllerState {
  cursor: Cursor;
  controls: Controls;
}

// TODO: Add support for enter, tab etc. (nextWord, prevWord, renaming next,prev to nextLetter, prevLetter)
export type DirectionalCommand = 'next' | 'prev' | 'switch' | 'nextRun' | 'prevRun';
export type Direction = 'horizontal' | 'vertical';

export function convertDirectionalCommand(controls: Controls, command: MovementInput): DirectionalCommand {
  if (controls.direction === 'horizontal') {
    switch (command.value) {
      case 'left':
        return 'prev';
      case 'right':
        return 'next';
      case 'nextLine':
        return 'nextRun';
      case 'prevLine':
        return 'prevRun';
      default:
        return 'switch';
    }
  } else {
    switch (command.value) {
      case 'up':
        return 'prev';
      case 'down':
        return 'next';
      case 'nextLine':
        return 'nextRun';
      case 'prevLine':
        return 'prevRun';
      default:
        return 'switch';
    }
  }
}

export function toggleDirection(direction: Direction): Direction {
  return direction === 'horizontal' ? 'vertical' : 'horizontal';
}

export function cursorIncr(bounds: Dimensions, cursor: Cursor, controls: Controls, value: -1 | 1): Cursor {
  // TODO: skip over blocked cells?
  if (controls.direction === 'horizontal') {
    return {
      row: cursor.row,
      col: clamp(cursor.col + value, 0, bounds.cols - 1),
    };
  } else {
    return {
      row: clamp(cursor.row + value, 0, bounds.rows - 1),
      col: cursor.col,
    };
  }
}

export function controllerNext(
  cells: AnyCell[][],
  controller: ControllerState,
  input: DirectionalCommand,
): ControllerState {
  const bounds: Dimensions = dims(cells);
  if (input === 'switch') {
    return { ...controller, controls: { direction: toggleDirection(controller.controls.direction) } };
  }
  // TODO: This currently goes to the next line, not the prev run. Figure out of this is correct behavior, and if so update the literals
  // If it should go to the next run, implement that.
  if (input === 'nextRun' || input === 'prevRun') {
    // If at the end of the crossword, switch directions and go to start
    if (controller.controls.direction === 'horizontal') {
      if (controller.cursor.row === bounds.rows - 1) {
        const row = findFirstNonblocked(cells, { axis: 'row', index: 0 }) ?? 0;
        return { cursor: { row: row, col: 0 }, controls: { direction: 'vertical' } };
      }
      // Increment the line
      const row = controller.cursor.row + 1;
      const col = findFirstNonblocked(cells, { axis: 'col', index: row }) ?? 0;
      return { ...controller, cursor: { row: row, col: col } };
    } else {
      if (controller.cursor.col === bounds.cols - 1) {
        const col = findFirstNonblocked(cells, { axis: 'col', index: 0 }) ?? 0;
        return { cursor: { row: 0, col: col }, controls: { direction: 'horizontal' } };
      }
      // Increment the line
      const col = controller.cursor.col + 1;
      const row = findFirstNonblocked(cells, { axis: 'row', index: col }) ?? 0;
      return { ...controller, cursor: { row: row, col: col } };
    }
  }
  const value = input === 'next' ? 1 : -1;
  return { ...controller, cursor: cursorIncr(bounds, controller.cursor, controller.controls, value) };
}
