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

  /**
   * Import FitDays body composition data with merge strategy
   * Merge strategy: "newest timestamp wins" when conflicts occur
   * - If a weight entry exists for the same date, compare timestamps
   * - Keep the entry with the most recent updated_at timestamp
   * - Preserves manual entries if they are more recent than FitDays data
   */
  async importFitDaysWeights(fitDaysWeights: Weight[]): Promise<{
    imported: number;
    updated: number;
    skipped: number;
  }> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`🏋️ Starting FitDays import with ${fitDaysWeights.length} weight records`);

    for (const fitDaysWeight of fitDaysWeights) {
      // Find existing weight entry for this date
      const existing = await db.weights
        .where('date')
        .equals(fitDaysWeight.date)
        .first();

      console.log(`\n📅 Processing ${fitDaysWeight.date}:`);
      console.log(`  FitDays: ${fitDaysWeight.weight}kg, BF: ${fitDaysWeight.bodyFat}%, updated_at: ${fitDaysWeight.updated_at}`);
      if (existing) {
        console.log(`  Existing: ${existing.weight}kg, BF: ${existing.bodyFat}%, updated_at: ${existing.updated_at}, created_at: ${existing.created_at}`);
      } else {
        console.log(`  Existing: NONE`);
      }

      if (!existing) {
        // No existing entry for this date - add new entry
        await db.weights.add({
          ...fitDaysWeight,
          id: fitDaysWeight.id || generateId(),
          created_at: fitDaysWeight.created_at || getTimestamp(),
        });
        imported++;
        console.log(`✅ Added FitDays weight for ${fitDaysWeight.date}: ${fitDaysWeight.weight}kg`);
      } else {
        // Entry exists - apply merge strategy
        // STRATEGY: Always import body composition data from FitDays
        // Only update weight value if FitDays timestamp is newer
        const existingTimestamp = existing.updated_at || existing.created_at;
        const fitDaysTimestamp = fitDaysWeight.updated_at || fitDaysWeight.created_at;

        console.log(`  Comparing timestamps: FitDays (${fitDaysTimestamp}) vs Existing (${existingTimestamp})`);
        console.log(`  FitDays is newer? ${fitDaysTimestamp > existingTimestamp}`);

        if (fitDaysTimestamp > existingTimestamp) {
          // FitDays data is newer - update everything
          await db.weights.update(existing.id!, {
            weight: fitDaysWeight.weight,
            bodyFat: fitDaysWeight.bodyFat,
            boneMass: fitDaysWeight.boneMass,
            bmr: fitDaysWeight.bmr,
            source: fitDaysWeight.source,
            updated_at: fitDaysWeight.updated_at,
            // Preserve manual note if it exists
            note: existing.note || fitDaysWeight.note,
          });
          updated++;
          console.log(`🔄 Updated weight for ${fitDaysWeight.date} (FitDays data is newer - all fields updated)`);
        } else {
          // Existing weight is newer, but still import body composition data if missing
          const updates: Partial<Weight> = {};
          let hasUpdates = false;

          // Add body composition fields if they don't exist in the current record
          if (fitDaysWeight.bodyFat !== undefined && existing.bodyFat === undefined) {
            updates.bodyFat = fitDaysWeight.bodyFat;
            hasUpdates = true;
          }
          if (fitDaysWeight.boneMass !== undefined && existing.boneMass === undefined) {
            updates.boneMass = fitDaysWeight.boneMass;
            hasUpdates = true;
          }
          if (fitDaysWeight.bmr !== undefined && existing.bmr === undefined) {
            updates.bmr = fitDaysWeight.bmr;
            hasUpdates = true;
          }

          if (hasUpdates) {
            await db.weights.update(existing.id!, updates);
            updated++;
            console.log(`🔄 Added body composition data to ${fitDaysWeight.date} (kept existing weight)`);
          } else {
            skipped++;
            console.log(`⏭️ Skipped ${fitDaysWeight.date} (existing data is complete and newer)`);
          }
        }
      }
    }

    console.log(`🏋️ FitDays import complete: ${imported} added, ${updated} updated, ${skipped} skipped`);

    // Trigger auto-sync if we made changes
    if (imported > 0 || updated > 0) {
      syncService.triggerAutoSync();
    }

    return { imported, updated, skipped };
  }
}

// Singleton instance
export const weightsService = new WeightsService();
