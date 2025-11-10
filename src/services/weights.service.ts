/**
 * Weights Service
 *
 * Service voor gewicht tracking operaties
 */

import { db } from './database.service';
import type { Weight } from '@/types';
import { generateId, getTimestamp } from '@/utils/date.utils';
import { syncService } from './sync.service';

class WeightsService {
  /**
   * Haal alle gewichten op, gesorteerd op datum (nieuwste eerst)
   */
  async getAllWeights(): Promise<Weight[]> {
    return await db.weights.orderBy('date').reverse().toArray();
  }

  /**
   * Haal gewichten op voor een specifieke datum range
   */
  async getWeightsByDateRange(startDate: string, endDate: string): Promise<Weight[]> {
    return await db.weights
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Haal een specifiek gewicht op
   */
  async getWeightById(id: string): Promise<Weight | undefined> {
    return await db.weights.get(id);
  }

  /**
   * Haal het meest recente gewicht op
   */
  async getLatestWeight(): Promise<Weight | undefined> {
    const weights = await db.weights.orderBy('date').reverse().limit(1).toArray();
    return weights[0];
  }

  /**
   * Voeg een nieuw gewicht toe
   */
  async addWeight(weight: Omit<Weight, 'id' | 'created_at'>): Promise<string> {
    const id = generateId();
    const newWeight: Weight = {
      ...weight,
      id,
      created_at: getTimestamp(),
    };

    await db.weights.add(newWeight);

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();

    return id;
  }

  /**
   * Update een bestaand gewicht
   */
  async updateWeight(id: string, updates: Partial<Omit<Weight, 'id' | 'created_at'>>): Promise<void> {
    await db.weights.update(id, updates);

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();
  }

  /**
   * Verwijder een gewicht (soft delete)
   */
  async deleteWeight(id: string): Promise<void> {
    await db.weights.update(id, {
      deleted: true,
      deleted_at: getTimestamp(),
    });

    // Trigger auto-sync (debounced 30s)
    syncService.triggerAutoSync();
  }

  /**
   * Verwijder alle gewichten (voor testing/reset)
   */
  async deleteAllWeights(): Promise<number> {
    const count = await db.weights.count();
    await db.weights.clear();
    console.log(`✅ ${count} weights cleared`);
    return count;
  }

  /**
   * Bulk import van gewichten (voor data import) - met duplicaat detectie
   */
  async importWeights(weights: Array<Omit<Weight, 'id' | 'created_at'>>): Promise<number> {
    // Haal alle bestaande weights op
    const existingWeights = await db.weights.toArray();

    // Maak een Set van unieke keys (datum + gewicht)
    const existingKeys = new Set(
      existingWeights.map(w => `${w.date}|${w.weight}`)
    );

    // Filter alleen nieuwe weights (geen duplicaten)
    const newWeights = weights.filter(weight => {
      const key = `${weight.date}|${weight.weight}`;
      return !existingKeys.has(key);
    });

    if (newWeights.length === 0) {
      console.log(`ℹ️ No new weights to add (all ${weights.length} were duplicates)`);
      return 0;
    }

    const weightsToAdd: Weight[] = newWeights.map(w => ({
      ...w,
      id: generateId(),
      created_at: getTimestamp(),
    }));

    await db.weights.bulkAdd(weightsToAdd);
    console.log(`✅ Bulk added ${weightsToAdd.length} new weights (${weights.length - newWeights.length} duplicates skipped)`);
    return weightsToAdd.length;
  }

  /**
   * Export alle gewichten (voor backup)
   */
  async exportWeights(): Promise<Weight[]> {
    return await this.getAllWeights();
  }
}

// Singleton instance
export const weightsService = new WeightsService();
