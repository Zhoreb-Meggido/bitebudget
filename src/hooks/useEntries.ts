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
    // Filter out soft-deleted entries
    setEntries(data.filter(e => !e.deleted));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();

    // Listen for sync events to refresh data
    const handleSync = () => {
      console.log('🔄 useEntries: Reloading after sync');
      loadEntries();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => {
    const newEntry = await entriesService.addEntry(entry);
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updateEntry = useCallback(async (id: number | string, updates: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => {
    await entriesService.updateEntry(id, updates);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
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
    updateEntry,
    deleteEntry,
    getEntriesByDate,
    reloadEntries: loadEntries,
  };
}
