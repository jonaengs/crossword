interface EmptyCellValue {
  type: 'empty';
}

interface CorrectedCellValue {
  type: 'corrected';
  value: string;
}

interface UserInputCellValue {
  type: 'user';
  value: string;
}

interface DraftCellValue {
  type: 'draft';
  value: string;
}

interface BlockedCell {
  type: 'blocked';
}

type AnyCell = EmptyCellValue | CorrectedCellValue | UserInputCellValue | DraftCellValue | BlockedCell;
