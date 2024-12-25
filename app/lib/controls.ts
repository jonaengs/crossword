import { Dimensions } from './crossword';
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
export type DirectionalCommand = 'next' | 'prev' | 'switch';
export type Direction = 'horizontal' | 'vertical';

export function convertDirectionalCommand(controls: Controls, command: MovementInput): DirectionalCommand {
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
  bounds: Dimensions,
  controller: ControllerState,
  input: DirectionalCommand,
): ControllerState {
  if (input === 'switch') {
    return { ...controller, controls: { direction: toggleDirection(controller.controls.direction) } };
  }
  const value = input === 'next' ? 1 : -1;
  return { ...controller, cursor: cursorIncr(bounds, controller.cursor, controller.controls, value) };
}
