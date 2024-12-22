import { MovementInput } from './input';

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

export function coordsEqual(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.col === b.col;
}
