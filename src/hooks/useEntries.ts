/**
 * useEntries Hook - Beheer meal entries
 */

import { useState, useEffect, useCallback } from 'react';
import { entriesService } from '@/services/entries.service';
import { syncService } from '@/services/sync.service';
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

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();

    return newEntry;
  }, []);

  const updateEntry = useCallback(async (id: number | string, updates: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => {
    await entriesService.updateEntry(id, updates);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, []);

  const deleteEntry = useCallback(async (id: number | string) => {
    await entriesService.deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, []);

  const getEntriesByDate = useCallback((date: string) => {
    return entries.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }, [entries]);

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDate,
    reloadEntries: loadEntries,
  };
}
