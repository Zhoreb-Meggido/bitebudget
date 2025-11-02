/**
 * OpenFoodFacts API Service
 *
 * Handles all interactions with the OpenFoodFacts API v2
 * - Product lookup by barcode (EAN-13)
 * - Product search by name
 * - Conversion from OFF format to Product type
 */

import type {
  Product,
  OpenFoodFactsProduct,
  OpenFoodFactsResponse,
  OpenFoodFactsSearchResponse,
} from '../types/database.types';
import { generateId, getTimestamp } from '../utils/date.utils';

// Use proxy in development to avoid CORS issues
const OFF_API_BASE = import.meta.env.DEV
  ? '/api/openfoodfacts'
  : 'https://world.openfoodfacts.org';

const USER_AGENT = 'BiteBudget - Food Tracking App - Version 1.0 - https://github.com/yourusername/bitebudget';

class OpenFoodFactsService {
  private static instance: OpenFoodFactsService;

  private constructor() {}

  static getInstance(): OpenFoodFactsService {
    if (!OpenFoodFactsService.instance) {
      OpenFoodFactsService.instance = new OpenFoodFactsService();
    }
    return OpenFoodFactsService.instance;
  }

  /**
   * Lookup product by barcode (EAN-13)
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const url = `${OFF_API_BASE}/api/v2/product/${barcode}.json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.warn(`❌ OFF API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 0 || !data.product) {
        console.log(`ℹ️ Product not found in OFF database: ${barcode}`);
        return null;
      }

      return this.convertToProduct(data.product);
    } catch (error) {
      console.error('❌ Error fetching product from OFF:', error);
      return null;
    }
  }

  /**
   * Search products by name
   */
  async searchProducts(query: string, pageSize: number = 10): Promise<Product[]> {
    try {
      // Try v3 API first (better CORS support)
      const url = `${OFF_API_BASE}/api/v3/search?q=${encodeURIComponent(query)}&page_size=${pageSize}&fields=code,product_name,brands,nutriments,nutriscore_grade,image_front_small_url,image_front_url,image_url`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!response.ok) {
        console.warn(`❌ OFF API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: OpenFoodFactsSearchResponse = await response.json();

      if (!data.products || data.products.length === 0) {
        console.log(`ℹ️ No products found for query: ${query}`);
        return [];
      }

      return data.products
        .map(p => this.convertToProduct(p))
        .filter((p): p is Product => p !== null);
    } catch (error) {
      console.error('❌ Error searching products from OFF:', error);
      return [];
    }
  }

  /**
   * Convert OpenFoodFacts product to our Product type
   */
  private convertToProduct(offProduct: OpenFoodFactsProduct): Product | null {
    try {
      const nutriments = offProduct.nutriments;

      // Validate required fields
      if (!offProduct.product_name || !nutriments) {
        console.warn('⚠️ OFF product missing required fields:', offProduct.code);
        return null;
      }

      // Extract nutrition data (with fallbacks to 0)
      const calories = nutriments['energy-kcal_100g'] || 0;
      const protein = nutriments.proteins_100g || 0;
      const carbohydrates = nutriments.carbohydrates_100g || 0;
      const sugars = nutriments.sugars_100g || 0;
      const fat = nutriments.fat_100g || 0;
      const saturatedFat = nutriments['saturated-fat_100g'] || 0;
      const fiber = nutriments.fiber_100g || 0;

      // Sodium: OFF uses grams, we use mg (1g = 1000mg)
      const sodiumGrams = nutriments.sodium_100g || 0;
      const sodium = sodiumGrams * 1000;

      // Choose best available image
      const image_url = offProduct.image_front_small_url ||
                       offProduct.image_front_url ||
                       offProduct.image_url;

      const now = getTimestamp();

      const product: Product = {
        id: generateId(),
        name: offProduct.product_name,
        calories,
        protein,
        carbohydrates,
        sugars,
        fat,
        saturatedFat,
        fiber,
        sodium,
        favorite: false,
        created_at: now,
        updated_at: now,

        // OpenFoodFacts specific fields
        ean: offProduct.code,
        source: 'barcode', // Will be overridden if from search
        openfoodfacts_id: offProduct.code,
        nutri_score: offProduct.nutriscore_grade?.toUpperCase(), // Convert to uppercase (A-E)
        image_url,
        brand: offProduct.brands,
        last_synced: now,
      };

      return product;
    } catch (error) {
      console.error('❌ Error converting OFF product:', error);
      return null;
    }
  }

  /**
   * Update existing product with latest data from OFF
   */
  async syncProduct(product: Product): Promise<Product | null> {
    if (!product.ean) {
      console.warn('⚠️ Cannot sync product without EAN:', product.name);
      return null;
    }

    const updatedProduct = await this.getProductByBarcode(product.ean);

    if (!updatedProduct) {
      return null;
    }

    // Preserve user-specific fields
    return {
      ...updatedProduct,
      id: product.id,
      favorite: product.favorite,
      created_at: product.created_at,
    };
  }
}

export const openFoodFactsService = OpenFoodFactsService.getInstance();
