import { useState, useEffect, useCallback } from 'react';

// TODO: Revisit this.
// 1. Not sure how I feel about the handling of values being set to null / deleted
// 2. Not sure whether creating a storage event is necessary
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
    onError?: (error: Error) => void;
  },
) {
  // Default serialization handlers
  const serialize = options?.serializer ?? JSON.stringify;
  const deserialize = options?.deserializer ?? JSON.parse;

  // Get initial value from localStorage or use initialValue
  const getInitialValue = () => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      options?.onError?.(error as Error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getInitialValue);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        localStorage.setItem(key, serialize(newValue));
        setStoredValue(newValue);
        // Dispatch storage event for cross-tab sync
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: serialize(newValue),
          }),
        );
      } catch (error) {
        options?.onError?.(error as Error);
      }
    },
    [key, serialize, storedValue, options],
  );

  // Remove item from localStorage
  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      options?.onError?.(error as Error);
    }
  }, [key, initialValue, options]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setStoredValue(initialValue);
      } else {
        try {
          setStoredValue(deserialize(event.newValue));
        } catch (error) {
          options?.onError?.(error as Error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, initialValue, options]);

  return { value: storedValue, setValue, remove };
}

export default useLocalStorage;
