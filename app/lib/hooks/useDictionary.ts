import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

export async function loadExampleDictionary() {
  const data = (await import('~/assets/dictionary/10k.txt?raw')).default;
  const words = data.split(/\r?\n/);
  return words;
}

export interface DictionaryInfo {
  name: string;
}

export type WordsList = string[];

export interface Dictionary {
  name: string;
  words: WordsList;
}

const EXAMPLE = 'Example';

/** Guarenteed to return at least one dictionary name */
export function useDictionaries() {
  const { value: fullDictionaries, setValue: setDictionaries } = useLocalStorage<Dictionary[]>('dictionaries', []);

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

  function addDictionary(dictionary: Dictionary) {
    setDictionaries([...fullDictionaries, dictionary]);
  }
  // Return only names so we don't always keep every dictionary in memory
  // If nothing has been stored, return the name of the example dictionary even if it hasn't been stored yet
  const dictionaryNames: DictionaryInfo[] =
    fullDictionaries.length > 0 ? fullDictionaries.map(({ name }) => ({ name })) : [{ name: EXAMPLE }];
  return { dictionaries: dictionaryNames, addDictionary };
}

export function useDictionary(name: string | null): Dictionary | undefined {
  const { value: dictionaries } = useLocalStorage<Dictionary[]>('dictionaries', []);
  if (name === null) {
    return undefined;
  }
  return dictionaries.find((dict) => dict.name === name);
}
