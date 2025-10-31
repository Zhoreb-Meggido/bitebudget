/**
 * ProductsModal - Producten database beheer
 */

import React, { useState } from 'react';
import type { Product } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateProduct: (id: number | string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: number | string) => Promise<void>;
  onToggleFavorite: (id: number | string) => Promise<void>;
  onImportJson: (json: string) => Promise<void>;
}

export function ProductsModal({ isOpen, onClose, products, onAddProduct, onUpdateProduct, onDeleteProduct, onToggleFavorite, onImportJson }: Props) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', calories: '', protein: '', fat: '', saturatedFat: '', fiber: '', sodium: '', favorite: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('favorite');
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setProductForm({ name: '', calories: '', protein: '', fat: '', saturatedFat: '', fiber: '', sodium: '', favorite: false });
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const handleSubmit = async () => {
    if (!productForm.name) return;
    const data = {
      name: productForm.name,
      calories: parseFloat(productForm.calories) || 0,
      protein: parseFloat(productForm.protein) || 0,
      fat: parseFloat(productForm.fat) || 0,
      saturatedFat: parseFloat(productForm.saturatedFat) || 0,
      fiber: parseFloat(productForm.fiber) || 0,
      sodium: parseInt(productForm.sodium) || 0,
      favorite: productForm.favorite,
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id!, data);
    } else {
      await onAddProduct(data);
    }
    resetForm();
  };

  const handleImportJsonClick = async () => {
    try {
      await onImportJson(jsonInput);
      setJsonInput('');
      setShowJsonImport(false);
    } catch (e) {
      alert('JSON import failed');
    }
  };

  const filteredProducts = products
    .filter(p => searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'favorite') {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      else if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      else if (sortBy === 'calories') return b.calories - a.calories;
      else if (sortBy === 'protein') return b.protein - a.protein;
      return 0;
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Producten Database</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setShowAddProduct(true)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">➕ Nieuw</button>
            <button onClick={() => setShowJsonImport(!showJsonImport)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">📥 JSON</button>
          </div>

          {showJsonImport && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-32 mb-2" placeholder='{"name": "Product", ...} of [...]' />
              <div className="flex gap-2">
                <button onClick={handleImportJsonClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Importeer</button>
                <button onClick={() => { setShowJsonImport(false); setJsonInput(''); }} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuleer</button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Zoek..." className="flex-1 px-4 py-2 border rounded-lg" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="favorite">Favorieten</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
              <option value="calories">Calorieën</option>
              <option value="protein">Eiwit</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredProducts.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <button onClick={() => onToggleFavorite(p.id!)} className="text-xl">{p.favorite ? '⭐' : '☆'}</button>
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-600">{p.calories} kcal • {p.protein}g eiw • {p.saturatedFat}g v.vet • {p.fiber}g vez • {p.sodium}mg natr</div>
                </div>
                <button onClick={() => { setEditingProduct(p); setProductForm(p as any); setShowAddProduct(true); }} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">✏️</button>
                <button onClick={() => { if (confirm('Verwijder?')) onDeleteProduct(p.id!); }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Bewerken' : 'Nieuw Product'}</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Naam</label><input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'fat', 'saturatedFat', 'fiber', 'sodium'] as const).map(field => (
                  <div key={field}><label className="block text-xs font-medium mb-1">{field === 'calories' ? 'Cal' : field === 'protein' ? 'Eiw' : field === 'fat' ? 'Vet' : field === 'saturatedFat' ? 'V.vet' : field === 'fiber' ? 'Vez' : 'Natr'} (per 100g)</label><input type="number" step={field === 'calories' || field === 'sodium' ? '1' : '0.1'} value={productForm[field]} onChange={(e) => setProductForm({...productForm, [field]: e.target.value})} className="w-full px-2 py-2 border rounded-lg text-sm" /></div>
                ))}
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={productForm.favorite} onChange={(e) => setProductForm({...productForm, favorite: e.target.checked})} /><label className="text-sm">Favoriet ⭐</label></div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">{editingProduct ? 'Bijwerken' : 'Toevoegen'}</button>
                <button onClick={resetForm} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">Annuleer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
