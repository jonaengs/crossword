/**
 * Code for handling/interpreting keyboard input
 */

export type DirectionalMovement = 'up' | 'down' | 'left' | 'right';
// TODO: Revisit these string values. They are not great.
export type MetaMovement = 'largeSkip' | 'largeSkipBack' | 'skip';

export interface MovementInput {
  type: 'directional';
  value: DirectionalMovement | MetaMovement;
}

export interface ValueInput {
  type: 'value';
  value: string;
}

export interface DeletionInput {
  type: 'delete';
}

export type AnyInput = MovementInput | ValueInput | DeletionInput;

const directionalKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
const whitespaceKeys = ['Tab', 'Enter', ' '] as const;
type DirectionalKey = (typeof directionalKeys)[number];
type WhitespaceKey = (typeof whitespaceKeys)[number];

const arrowKeyToMovement: Record<DirectionalKey, DirectionalMovement> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const whitespaceKeyToMovement: Record<WhitespaceKey, MetaMovement> = {
  Tab: 'largeSkip',
  Enter: 'largeSkip',
  ' ': 'skip',
};

export function translateKeyboardInput(event: KeyboardEvent): AnyInput | null {
  // Make sure we don't capture shortcuts we don't care about
  if (event.metaKey || event.ctrlKey) {
    return null;
  }

  const key = event.key;
  if (key === 'Backspace') {
    return { type: 'delete' } as DeletionInput;
  }
  if (directionalKeys.includes(key as DirectionalKey)) {
    return { type: 'directional', value: arrowKeyToMovement[key as DirectionalKey] } as MovementInput;
  }
  if (whitespaceKeys.includes(key as WhitespaceKey)) {
    // TODO: handle shift+tab
    return { type: 'directional', value: whitespaceKeyToMovement[key as WhitespaceKey] } as MovementInput;
  }
  if (key === 'Backspace') {
    return { type: 'delete' } as DeletionInput;
  }
  if (key.length === 1) {
    return { type: 'value', value: key } as ValueInput;
  }
  return null;
}
