import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

export function splitLines(contents: string): string[] {
  return contents.split(/\r?\n/);
}

export async function loadExampleDictionary() {
  const data = (await import('~/assets/dictionary/10k.txt?raw')).default;
  const words = splitLines(data);
  return words;
}

export interface DictionaryInfo {
  name: string;
}

export type WordsList = string[];

interface StoredDictionary {
  name: string;
  words: WordsList;
}

export interface Dictionary {
  name: string;
  /** Map from word length to words of that length from the given dictionary */
  ngrams: Record<number, string[]>;
}

const EXAMPLE = 'Example';

/** Guarenteed to return at least one dictionary name */
export function useDictionaries() {
  const { value: fullDictionaries, setValue: setDictionaries } = useLocalStorage<StoredDictionary[]>(
    'dictionaries',
    [],
  );

  // If no dictionaries have been stored, populate with the example dictionary
  useEffect(() => {
    const populate = async () => {
      setDictionaries([
        {
          name: EXAMPLE,
          words: await loadExampleDictionary(),
        },
      ]);
    };
    if (fullDictionaries.length === 0) {
      populate();
    }
  }, []);

  function addDictionary(dictionary: StoredDictionary) {
    setDictionaries([dictionary, ...fullDictionaries]);
  }
  // Return only names so we don't always keep every dictionary in memory
  // If nothing has been stored, return the name of the example dictionary even if it hasn't been stored yet
  const dictionaryNames: DictionaryInfo[] =
    fullDictionaries.length > 0 ? fullDictionaries.map(({ name }) => ({ name })) : [{ name: EXAMPLE }];
  return { dictionaries: dictionaryNames, addDictionary };
}

export function useDictionary(name: string | null): Dictionary | undefined {
  const { value: dictionaries } = useLocalStorage<StoredDictionary[]>('dictionaries', []);
  if (name === null) {
    return undefined;
  }
  const match = dictionaries.find((dict) => dict.name === name);
  if (!match) {
    return undefined;
  }

  const ngrams: Record<number, string[]> = {};
  for (const word of match.words) {
    const length = word.length;
    if (ngrams[length] === undefined) {
      ngrams[length] = [];
    }
    ngrams[length]!.push(word);
  }
  return {
    name: match.name,
    ngrams,
  };
}
