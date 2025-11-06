/**
 * useProducts Hook - Beheer product database
 */

import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products.service';
import { syncService } from '@/services/sync.service';
import type { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    const data = await productsService.getAllProducts();
    // Filter out soft-deleted products
    setProducts(data.filter(p => !p.deleted));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProduct = await productsService.addProduct(product);
    setProducts(prev => [...prev, newProduct]);

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();

    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id: number | string, updates: Partial<Product>) => {
    await productsService.updateProduct(id, updates);
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, []);

  const deleteProduct = useCallback(async (id: number | string) => {
    await productsService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, []);

  const toggleFavorite = useCallback(async (id: number | string) => {
    await productsService.toggleFavorite(id);
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, favorite: !p.favorite } : p)));

    // Trigger auto-sync if enabled
    syncService.triggerAutoSync();
  }, []);

  return {
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    reloadProducts: loadProducts,
  };
}
