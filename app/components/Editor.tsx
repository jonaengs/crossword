import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { useRef, useState } from 'react';
import { Coordinate } from '~/lib/controls';
import { AnnotatedHint, AnyCell, Run, dims, getCursorRun, isCursorInHintRun } from '~/lib/crossword';
import { fileIntoString } from '~/lib/files';
import { splitLines, useDictionaries, useDictionary } from '~/lib/hooks/useDictionary';
import useDictionarySearch from '~/lib/hooks/useDictionarySearch';
import useOnKeyboardInput from '~/lib/hooks/useOnKeyboardInput';
import { cn } from '~/lib/style';
import { useCrosswordEditorApplicationContext } from '~/state/editor';
import CellGrid from './CellGrid';

// TODO: Move Editor and Solver files somewhere else as they are not reusable without being wrapped in the correct context provider
// TODO: Ctrl-z, Ctrl-y/Ctrl-Shift-z for undo/redo

interface AnnotatedCell {
  inner: AnyCell;
  coordinates: Coordinate;
}

function getRunCells(cells: AnyCell[][], run: Run): AnnotatedCell[] {
  const cellsInRun: AnnotatedCell[] = [];
  for (let i = run.start.row; i <= run.end.row; i++) {
    for (let j = run.start.col; j <= run.end.col; j++) {
      cellsInRun.push({
        inner: cells[i]![j]!,
        coordinates: { row: i, col: j },
      });
    }
  }
  return cellsInRun;
}

function SearchResult({ words, onSelect }: { words: string[]; onSelect: (word: string) => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {words?.map((word) => (
        <li key={word} onClick={() => onSelect(word)} className="cursor-pointer hover:bg-gray-100">
          {word}
        </li>
      ))}
    </ul>
  );
}

/** For now, assumes that children is 'asChildable' */
function SearchPopover({
  children,
  dictionarySelector,
  search,
  onSelect,
}: {
  children: React.ReactNode;
  dictionarySelector: React.ReactNode;
  search: () => Promise<string[]>;
  onSelect: (word: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { words, state } = useDictionarySearch({
    search,
    enabled: isOpen,
    keys: [dictionarySelector],
  });

  const wrappedOnSelect = (word: string) => {
    onSelect(word);
    setIsOpen(false);
  };

  return (
    <Popover.Root onOpenChange={setIsOpen} open={isOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content>
          {/* TODO: Fix overflow so the dictionaryselector cannot be scrolled away from */}
          <div className="bg-white shadow-md p-2 min-w-40 max-w-72 max-h-80 overflow-y-auto">
            <div className="mb-1">{dictionarySelector}</div>
            {(() => {
              if (state === 'searching' || state === 'initial') {
                return <div>Searching...</div>;
              }
              if (state === 'error') {
                return (
                  <div className="text-sm text-gray-700">
                    Selection cannot be searched over.
                    <br /> Select another area and try again.
                  </div>
                );
              }
              if (words.length === 0) {
                return <div className="text-sm text-gray-700">Found 0 results.</div>;
              }
              return <SearchResult words={words} onSelect={wrappedOnSelect} />;
            })()}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Assumes the children is asChildable */
function DictionaryUploadDialog({
  children,
  onComplete,
}: {
  children: React.ReactNode;
  onComplete: (file: File, name: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const nameInput = form.elements.namedItem('name') as HTMLInputElement;
    const file = fileInput.files![0]!;
    const name = nameInput.value;
    await onComplete(file, name);
    setIsSubmitting(false);
    setIsOpen(false);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/15 fixed inset-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-xl min-h-44 p-4">
          <Dialog.Title className="text-lg">Upload a dictionary</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500">
            A dictionary file is expected to be a text file (.txt extension) containing words separate by newlines
          </Dialog.Description>
          <form className="flex flex-col" onSubmit={onSubmit}>
            <label htmlFor="file">
              File: <input type="file" accept=".txt" name="file" required />
            </label>

            <label htmlFor="name">
              Name: <input type="text" name="name" required />
            </label>

            <button type="submit" disabled={isSubmitting}>
              Add
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Toolbar() {
  /**
   * Functionality:
   * word search
   */

  const { crossword, setCell, controller } = useCrosswordEditorApplicationContext();
  const { cursor } = controller;
  const { dictionaries, addDictionary } = useDictionaries();
  const [selectedDictionary, setSelectedDictionary] = useState<string>(dictionaries.at(0)!.name);
  const dictionary = useDictionary(selectedDictionary);

  const cell = crossword.cells[cursor.row]![cursor.col]!;
  const isBlocked = cell.type === 'blocked';
  const currentCursorRun = getCursorRun(crossword.cells, controller);

  function toggleBlocked() {
    if (isBlocked) {
      setCell({ row: cursor.row, col: cursor.col }, { type: 'empty' });
    } else {
      setCell({ row: cursor.row, col: cursor.col }, { type: 'blocked' });
    }
  }

  function clear() {
    const cells = getRunCells(crossword.cells, currentCursorRun);
    for (let i = 0; i < cells.length; i++) {
      setCell(cells[i]!.coordinates, { type: 'empty' });
    }
  }

  function constructFilter(): RegExp {
    const cells = getRunCells(crossword.cells, currentCursorRun);
    const regex = cells
      .map(({ inner: cell }) => {
        // We cannot construct a regex for runs containing blocked cells
        if (cell.type === 'blocked') {
          throw new Error('Cannot construct regex for runs containing blocked cells');
        }
        if (cell.type === 'empty') {
          return '.';
        }
        return cell.value;
      })
      .join('');
    // Assume all words are lowercase, so no need for case-insensitive flag
    return new RegExp(`^${regex}$`);
  }

  // TODO: Add support for finding multiple words, so for a 5-run we can suggest [['do', 'bad'], ['be', 'sad']]. Should perhaps be hidden behind a 'show more' button
  // TODO: Add caching
  async function findWords() {
    // Force function onto event loop to allow for UI updates before the expensive lookup
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (dictionary === undefined) {
      return [];
    }
    const runLength =
      Math.max(
        currentCursorRun.end.row - currentCursorRun.start.row,
        currentCursorRun.end.col - currentCursorRun.start.col,
      ) + 1;
    const regex = constructFilter();
    const words = dictionary.ngrams[runLength]?.filter((word) => regex.test(word)) ?? [];
    return words;
  }

  function applyWord(word: string) {
    const cells = getRunCells(crossword.cells, currentCursorRun);
    if (cells.length !== word.length) {
      // Should not be possible, so we don't have any additional handling for this
      console.error('Word length does not match run length');
      return;
    }
    for (let i = 0; i < cells.length; i++) {
      setCell(cells[i]!.coordinates, { type: 'user', value: word[i]! });
    }
  }

  function DictionarySelector() {
    return (
      <div className="flex flex-row">
        <label className="mr-2">Dictionary:</label>

        <select
          value={selectedDictionary}
          onChange={(event) => setSelectedDictionary(event.target.value)}
          className="w-full p-1"
        >
          {dictionaries.map((dict) => (
            <option key={dict.name} value={dict.name}>
              {dict.name}
            </option>
          ))}
        </select>
        <DictionaryUploadDialog
          onComplete={async (file: File, name: string) => {
            const fileData = await fileIntoString(file);
            const words = splitLines(fileData);
            const newDict = { name, words };
            console.log(newDict);
            addDictionary(newDict);
            setSelectedDictionary(name);
          }}
        >
          <button className="font-bold ml-2">+</button>
        </DictionaryUploadDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 my-1">
      <button onClick={toggleBlocked}>{isBlocked ? 'Unblock' : 'Block'}</button>
      <button onClick={clear}>Clear</button>
      <SearchPopover search={findWords} onSelect={applyWord} dictionarySelector={<DictionarySelector />}>
        <button>Find</button>
      </SearchPopover>
    </div>
  );
}

function EditableHintsList({ direction, mayHighlight }: { direction: 'across' | 'down'; mayHighlight: boolean }) {
  const { crossword, controller, setHint, setController } = useCrosswordEditorApplicationContext();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hints = crossword.hints[direction];

  // If the list may highlight a hint, find the hint whose run the controller's cursor lies within
  const hintOnCursor: AnnotatedHint | null =
    (mayHighlight && hints.find((hint) => isCursorInHintRun(hint, controller.cursor))) || null;

  // On focusin a hint, set the controller's cursor to the startint cell of the hint's run
  function onFocusHint(hint: AnnotatedHint) {
    setController(hint.run.start, hint.direction === 'across' ? 'horizontal' : 'vertical');
  }

  function onLabelClick(idx: number) {
    const ref = inputRefs.current[idx];
    if (ref) {
      ref.focus();
    }
  }

  return (
    <>
      <h4 className="font-bold title">{direction}</h4>
      <div className="flex flex-col gap-1">
        {hints.map((hint, i) => (
          <li
            key={i}
            className={cn('flex items-start', hint === hintOnCursor && 'bg-blue-200')}
            onFocus={() => onFocusHint(hint)}
          >
            <span className="mr-1 w-6 text-right cursor-pointer" onClick={() => onLabelClick(i)}>
              {hint.index}.
            </span>
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
                return () => {
                  inputRefs.current[i] = null;
                };
              }}
              type="text"
              value={hint.text}
              placeholder="hint"
              className="bg-inherit"
              onChange={(event) => setHint(direction, i, event.target.value)}
            />
          </li>
        ))}
      </div>
    </>
  );
}

function Editor() {
  const { crossword, controller, handleInput, setController } = useCrosswordEditorApplicationContext();
  const controllerDirection = controller.controls.direction;
  const keyboardCaptureAreaRef = useRef<HTMLDivElement>(null);

  useOnKeyboardInput(handleInput, keyboardCaptureAreaRef);

  // TODO: Add preview button that opens the crossword up in the solver inside a dialog or something like that
  return (
    <div className="flex flex-row justify-center gap-4">
      {/* Crossword */}
      <div className="flex flex-col items-center" ref={keyboardCaptureAreaRef}>
        <Toolbar />
        <CellGrid
          dimensions={dims(crossword.cells)}
          cells={crossword.cells}
          hints={crossword.hints}
          controller={controller}
          setController={setController}
        />
      </div>
      {/* Hints */}
      <div className="flow-col gap-4 mt-6">
        <EditableHintsList direction="across" mayHighlight={controllerDirection === 'horizontal'} />
        <EditableHintsList direction="down" mayHighlight={controllerDirection === 'vertical'} />
      </div>
    </div>
  );
}

export default Editor;
