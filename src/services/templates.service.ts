/**
 * TemplatesService
 *
 * CRUD operaties voor meal templates
 */

import { db } from './database.service';
import type { MealTemplate } from '@/types';
import { getTimestamp, generateId } from '@/utils';
import { syncService } from './sync.service';

class TemplatesService {
  /**
   * Laad alle templates
   */
  async getAllTemplates(): Promise<MealTemplate[]> {
    try {
      const allTemplates = await db.mealTemplates.toArray();
      return allTemplates.filter(t => !t.deleted);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      return [];
    }
  }

  /**
   * Laad alle templates inclusief soft-deleted (voor sync)
   */
  async getAllTemplatesIncludingDeleted(): Promise<MealTemplate[]> {
    try {
      return await db.mealTemplates.toArray();
    } catch (error) {
      console.error('❌ Error loading templates (including deleted):', error);
      return [];
    }
  }

  /**
   * Laad templates gesorteerd op recent gebruik
   */
  async getRecentTemplates(limit: number = 5): Promise<MealTemplate[]> {
    try {
      return await db.mealTemplates
        .filter(t => !t.deleted && t.lastUsed)
        .toArray()
        .then(templates =>
          templates
            .sort((a, b) => (b.lastUsed || '').localeCompare(a.lastUsed || ''))
            .slice(0, limit)
        );
    } catch (error) {
      console.error('❌ Error loading recent templates:', error);
      return [];
    }
  }

  /**
   * Laad favorite templates
   */
  async getFavoriteTemplates(): Promise<MealTemplate[]> {
    try {
      return await db.mealTemplates
        .filter(t => !t.deleted && t.isFavorite)
        .sortBy('name');
    } catch (error) {
      console.error('❌ Error loading favorite templates:', error);
      return [];
    }
  }

  /**
   * Laad templates per category
   */
  async getTemplatesByCategory(category: string): Promise<MealTemplate[]> {
    try {
      return await db.mealTemplates
        .where('category')
        .equals(category)
        .filter(t => !t.deleted)
        .sortBy('name');
    } catch (error) {
      console.error('❌ Error loading templates by category:', error);
      return [];
    }
  }

  /**
   * Voeg nieuwe template toe
   */
  async addTemplate(template: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<MealTemplate> {
    try {
      const now = getTimestamp();
      const newTemplate: MealTemplate = {
        ...template,
        id: generateId(),
        useCount: 0,
        created_at: now,
        updated_at: now,
      };

      await db.mealTemplates.add(newTemplate);
      console.log('✅ Template added:', newTemplate.name);

      // Trigger auto-sync (debounced 30s)
      syncService.triggerAutoSync();

      return newTemplate;
    } catch (error) {
      console.error('❌ Error adding template:', error);
      throw error;
    }
  }

  /**
   * Update bestaande template
   */
  async updateTemplate(id: number | string, updates: Partial<MealTemplate>): Promise<void> {
    try {
      const now = getTimestamp();
      await db.mealTemplates.update(id, {
        ...updates,
        updated_at: now,
      });
      console.log('✅ Template updated:', id);

      // Trigger auto-sync (debounced 30s)
      syncService.triggerAutoSync();
    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }
  }

  /**
   * Verwijder template (soft delete)
   */
  async deleteTemplate(id: number | string): Promise<void> {
    try {
      await db.mealTemplates.update(id, {
        deleted: true,
        deleted_at: getTimestamp(),
        updated_at: getTimestamp(),
      });
      console.log('✅ Template soft deleted:', id);

      // Trigger auto-sync (debounced 30s)
      syncService.triggerAutoSync();
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: number | string): Promise<void> {
    try {
      const template = await db.mealTemplates.get(id);
      if (!template) {
        throw new Error('Template not found');
      }

      await db.mealTemplates.update(id, {
        isFavorite: !template.isFavorite,
        updated_at: getTimestamp(),
      });

      console.log('✅ Template favorite toggled:', id);

      // Trigger auto-sync (debounced 30s)
      syncService.triggerAutoSync();
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Track template usage (increment useCount, update lastUsed)
   */
  async trackUsage(id: number | string): Promise<void> {
    try {
      const template = await db.mealTemplates.get(id);
      if (!template) {
        throw new Error('Template not found');
      }

      await db.mealTemplates.update(id, {
        useCount: (template.useCount || 0) + 1,
        lastUsed: getTimestamp(),
        updated_at: getTimestamp(),
      });

      console.log('✅ Template usage tracked:', id);

      // Trigger auto-sync (debounced 30s)
      syncService.triggerAutoSync();
    } catch (error) {
      console.error('❌ Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Bulk add templates (voor import)
   */
  async bulkAddTemplates(templates: MealTemplate[]): Promise<number> {
    try {
      const existingTemplates = await db.mealTemplates.toArray();

      // Maak een Set van unieke names
      const existingNames = new Set(
        existingTemplates.map(t => t.name)
      );

      // Filter alleen nieuwe templates (geen duplicaten)
      const newTemplates = templates.filter(template => {
        return !existingNames.has(template.name);
      });

      if (newTemplates.length > 0) {
        await db.mealTemplates.bulkPut(newTemplates);
        console.log(`✅ Bulk added ${newTemplates.length} new templates`);
      }

      return newTemplates.length;
    } catch (error) {
      console.error('❌ Error bulk adding templates:', error);
      throw error;
    }
  }

  /**
   * Clear alle templates (voorzichtig!)
   */
  async clearAllTemplates(): Promise<number> {
    try {
      const count = await db.mealTemplates.count();
      await db.mealTemplates.clear();
      console.log(`✅ ${count} templates cleared`);
      return count;
    } catch (error) {
      console.error('❌ Error clearing templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const templatesService = new TemplatesService();
export default templatesService;
