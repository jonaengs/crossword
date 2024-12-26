import { useEffect, useState } from 'react';

export interface UseDictionarSearchProps {
  search: () => Promise<string[]>;
  enabled: boolean;
  keys: unknown[];
}

function useDictionarySearch({ enabled, search, keys }: UseDictionarSearchProps) {
  const [words, setWords] = useState<string[]>([]);
  const [state, setState] = useState<'initial' | 'searching' | 'done' | 'error'>('initial');

  async function doSearch() {
    setState('searching');
    try {
      const words = await search();
      setWords(words ?? []);
      setState('done');
    } catch (e) {
      console.error(e);
      setState('error');
    }
  }

  useEffect(() => {
    if (enabled) {
      doSearch();
    }
  }, [enabled, ...keys]);

  return { words, state };
}

export default useDictionarySearch;
