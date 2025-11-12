import { useState, useMemo } from 'react';
import { useTemplates, useDebounce } from '@/hooks';
import type { MealTemplate } from '@/types';
import { TemplateEditModal } from './TemplateEditModal';

export function TemplatesTab() {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate, toggleFavorite } = useTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Debounce search query to reduce filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(null);

  // Handlers
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: MealTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (data: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id!, data);
    } else {
      await addTemplate(data);
    }
  };

  const handleToggleFavorite = async (template: MealTemplate) => {
    await toggleFavorite(template.id!);
  };

  const handleDeleteTemplate = async (template: MealTemplate) => {
    if (!confirm(`Weet je zeker dat je template "${template.name}" wilt verwijderen?`)) {
      return;
    }
    await deleteTemplate(template.id!);
  };

  // Filter templates based on debounced search and favorites filter
  const filteredTemplates = useMemo(() =>
    templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (template.category && template.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (showOnlyFavorites) {
        return template.isFavorite;
      }

      return true;
    }),
    [templates, debouncedSearchQuery, showOnlyFavorites]
  );

  // Group templates by category
  const templatesByCategory = useMemo(() =>
    filteredTemplates.reduce((acc, template) => {
      const category = template.category || 'Zonder categorie';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, MealTemplate[]>),
    [filteredTemplates]
  );

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={showOnlyFavorites}
            onChange={(e) => setShowOnlyFavorites(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Alleen favorieten</span>
        </label>
      </div>

      {/* Templates Count */}
      <div className="text-sm text-gray-600">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} gevonden
      </div>

      {/* Templates List by Category */}
      <div className="space-y-6">
        {Object.keys(templatesByCategory).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen templates gevonden
          </div>
        ) : (
          Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {category} ({categoryTemplates.length})
              </h3>
              <div className="space-y-3">
                {categoryTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEditTemplate}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Template Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleAddTemplate}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + Nieuwe template
        </button>
      </div>

      {/* Modal */}
      <TemplateEditModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}

// Sub-component for template card
interface TemplateCardProps {
  template: MealTemplate;
  onEdit: (template: MealTemplate) => void;
  onToggleFavorite: (template: MealTemplate) => void;
  onDelete: (template: MealTemplate) => void;
}

function TemplateCard({ template, onEdit, onToggleFavorite, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Template Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900">
            {template.isFavorite && '⭐ '}
            {template.name}
          </h4>
          {template.category && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              {template.category}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggleFavorite(template)}
            className="text-xl hover:scale-110 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={template.isFavorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
          >
            {template.isFavorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="text-xl hover:scale-110 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Bewerken"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(template)}
            className="text-xl hover:scale-110 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Verwijderen"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Template Items */}
      {template.products && template.products.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">
            Producten ({template.products.length}):
          </h5>
          <div className="space-y-1">
            {template.products.map((product, index) => (
              <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded text-sm">
                <span className="text-gray-900">{product.name}</span>
                <span className="text-gray-600">
                  {product.grams}g
                  {product.portionName && (
                    <span className="text-gray-500 ml-1">({product.portionName})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {template.useCount !== undefined && template.useCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="text-xs text-gray-500">
            Gebruikt: {template.useCount}x
            {template.lastUsed && (
              <span className="ml-2">
                • Laatst: {new Date(template.lastUsed).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
