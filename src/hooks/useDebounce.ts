/**
 * useDebounce Hook - Debounce a value to reduce update frequency
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value - only updates after specified delay
 * Useful for search inputs to reduce filtering/API calls
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
