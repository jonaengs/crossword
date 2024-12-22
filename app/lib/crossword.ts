export interface EmptyCellValue {
  type: 'empty';
}

export interface CorrectedCellValue {
  type: 'corrected';
  value: string;
}

export interface UserInputCellValue {
  type: 'user';
  value: string;
}

export interface DraftCellValue {
  type: 'draft';
  value: string;
}

export interface BlockedCell {
  type: 'blocked';
}

export type AnyCell = EmptyCellValue | CorrectedCellValue | UserInputCellValue | DraftCellValue | BlockedCell;
