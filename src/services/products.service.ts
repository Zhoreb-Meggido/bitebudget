/**
 * ProductsService
 *
 * CRUD operaties voor product database
 */

import { db } from './database.service';
import type { Product } from '@/types';
import { getTimestamp, generateId } from '@/utils';

class ProductsService {
  /**
   * Laad alle producten
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      return await db.products.toArray();
    } catch (error) {
      console.error('❌ Error loading products:', error);
      return [];
    }
  }

  /**
   * Laad product by name
   */
  async getProductByName(name: string): Promise<Product | undefined> {
    try {
      return await db.products.where('name').equalsIgnoreCase(name).first();
    } catch (error) {
      console.error('❌ Error loading product:', error);
      return undefined;
    }
  }

  /**
   * Laad product by EAN barcode
   */
  async getProductByEAN(ean: string): Promise<Product | undefined> {
    try {
      return await db.products.where('ean').equals(ean).first();
    } catch (error) {
      console.error('❌ Error loading product by EAN:', error);
      return undefined;
    }
  }

  /**
   * Laad favoriete producten
   */
  async getFavoriteProducts(): Promise<Product[]> {
    try {
      return await db.products.where('favorite').equals(true).toArray();
    } catch (error) {
      console.error('❌ Error loading favorite products:', error);
      return [];
    }
  }

  /**
   * Voeg nieuw product toe
   */
  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      // Check for duplicate EAN if present
      if (product.ean) {
        const existing = await db.products.where('ean').equals(product.ean).first();
        if (existing) {
          console.log('⚠️ Product with EAN already exists:', existing.name);
          throw new Error(`Product met barcode ${product.ean} bestaat al: ${existing.name}`);
        }
      }

      const now = getTimestamp();
      const newProduct: Product = {
        ...product,
        source: product.source || 'manual', // Default to manual if not specified
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      await db.products.add(newProduct);
      console.log('✅ Product added:', newProduct.name);
      return newProduct;
    } catch (error) {
      console.error('❌ Error adding product:', error);
      throw error;
    }
  }

  /**
   * Update bestaand product
   */
  async updateProduct(id: number | string, updates: Partial<Product>): Promise<void> {
    try {
      const now = getTimestamp();
      await db.products.update(id, {
        ...updates,
        updated_at: now,
      });
      console.log('✅ Product updated:', id);
    } catch (error) {
      console.error('❌ Error updating product:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: number | string): Promise<void> {
    try {
      const product = await db.products.get(id);
      if (product) {
        await this.updateProduct(id, { favorite: !product.favorite });
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Verwijder product
   */
  async deleteProduct(id: number | string): Promise<void> {
    try {
      await db.products.delete(id);
      console.log('✅ Product deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Smart merge: voeg producten toe of update bestaande
   * Gebruikt naam als unique identifier
   */
  async mergeProducts(products: Array<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<{
    added: number;
    updated: number;
  }> {
    try {
      const now = getTimestamp();
      let added = 0;
      let updated = 0;

      for (const product of products) {
        const existing = await this.getProductByName(product.name);

        if (existing) {
          // Update bestaand product (behoud favorite status en id)
          await db.products.update(existing.id!, {
            calories: product.calories,
            protein: product.protein,
            fat: product.fat,
            saturatedFat: product.saturatedFat,
            fiber: product.fiber,
            sodium: product.sodium,
            // Update OpenFoodFacts fields if present
            ...(product.ean && { ean: product.ean }),
            ...(product.source && { source: product.source }),
            ...(product.openfoodfacts_id && { openfoodfacts_id: product.openfoodfacts_id }),
            ...(product.nutri_score && { nutri_score: product.nutri_score }),
            ...(product.image_url && { image_url: product.image_url }),
            ...(product.brand && { brand: product.brand }),
            ...(product.last_synced && { last_synced: product.last_synced }),
            updated_at: now,
          });
          updated++;
        } else {
          // Voeg nieuw product toe
          await db.products.add({
            ...product,
            id: generateId(),
            created_at: now,
            updated_at: now,
          });
          added++;
        }
      }

      console.log(`✅ Products merged: ${added} added, ${updated} updated`);
      return { added, updated };
    } catch (error) {
      console.error('❌ Error merging products:', error);
      throw error;
    }
  }

  /**
   * Bulk add products (voor import)
   */
  async bulkAddProducts(products: Product[]): Promise<void> {
    try {
      await db.products.bulkPut(products);
      console.log(`✅ Bulk added ${products.length} products`);
    } catch (error) {
      console.error('❌ Error bulk adding products:', error);
      throw error;
    }
  }

  /**
   * Clear alle producten (voorzichtig!)
   */
  async clearAllProducts(): Promise<void> {
    try {
      await db.products.clear();
      console.log('✅ All products cleared');
    } catch (error) {
      console.error('❌ Error clearing products:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const productsService = new ProductsService();
export default productsService;
