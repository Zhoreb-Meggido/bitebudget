/**
 * useTemplates Hook - Beheer meal templates
 */

import { useState, useEffect, useCallback } from 'react';
import { templatesService } from '@/services/templates.service';
import type { MealTemplate } from '@/types';

export function useTemplates() {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<MealTemplate[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<MealTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    const [all, recent, favorites] = await Promise.all([
      templatesService.getAllTemplates(),
      templatesService.getRecentTemplates(5),
      templatesService.getFavoriteTemplates(),
    ]);
    setTemplates(all);
    setRecentTemplates(recent);
    setFavoriteTemplates(favorites);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();

    // Listen for sync events to refresh data
    const handleSync = () => {
      console.log('🔄 useTemplates: Reloading after sync');
      loadTemplates();
    };
    window.addEventListener('data-synced', handleSync);

    return () => {
      window.removeEventListener('data-synced', handleSync);
    };
  }, [loadTemplates]);

  const addTemplate = useCallback(async (template: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const newTemplate = await templatesService.addTemplate(template);
    setTemplates(prev => [...prev, newTemplate]);

    // Add to favorites if marked as favorite
    if (newTemplate.isFavorite) {
      setFavoriteTemplates(prev => [...prev, newTemplate]);
    }

    return newTemplate;
  }, []);

  const updateTemplate = useCallback(async (id: number | string, updates: Partial<MealTemplate>) => {
    await templatesService.updateTemplate(id, updates);

    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    setRecentTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    setFavoriteTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));

  }, []);

  const deleteTemplate = useCallback(async (id: number | string) => {
    await templatesService.deleteTemplate(id);

    setTemplates(prev => prev.filter(t => t.id !== id));
    setRecentTemplates(prev => prev.filter(t => t.id !== id));
    setFavoriteTemplates(prev => prev.filter(t => t.id !== id));

  }, []);

  const toggleFavorite = useCallback(async (id: number | string) => {
    await templatesService.toggleFavorite(id);
    await loadTemplates(); // Reload to get updated favorites

  }, [loadTemplates]);

  const trackUsage = useCallback(async (id: number | string) => {
    await templatesService.trackUsage(id);
    await loadTemplates(); // Reload to get updated recent list

  }, [loadTemplates]);

  const getTemplatesByCategory = useCallback(async (category: string) => {
    return await templatesService.getTemplatesByCategory(category);
  }, []);

  return {
    templates,
    recentTemplates,
    favoriteTemplates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    trackUsage,
    getTemplatesByCategory,
    reloadTemplates: loadTemplates,
  };
}
