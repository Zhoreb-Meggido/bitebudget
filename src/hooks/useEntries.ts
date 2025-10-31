/**
 * useEntries Hook - Beheer meal entries
 */

import { useState, useEffect, useCallback } from 'react';
import { entriesService } from '@/services/entries.service';
import type { Entry } from '@/types';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    const data = await entriesService.getAllEntries();
    setEntries(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => {
    const newEntry = await entriesService.addEntry(entry);
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const deleteEntry = useCallback(async (id: number | string) => {
    await entriesService.deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEntriesByDate = useCallback((date: string) => {
    return entries.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }, [entries]);

  return {
    entries,
    isLoading,
    addEntry,
    deleteEntry,
    getEntriesByDate,
    reloadEntries: loadEntries,
  };
}
