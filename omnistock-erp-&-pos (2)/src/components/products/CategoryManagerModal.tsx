import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Tag, Plus, Trash2, X, Check, Layers, AlertCircle } from 'lucide-react';

interface CategoryManagerModalProps {
  dbState: DatabaseState;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  dbState,
  onClose,
  onSelectCategory
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get all categories and product counts
  const allCategories = dbStore.getCategories();
  const productCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dbState.products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [dbState.products]);

  const customCats = dbState.customCategories || [];

  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a category name');
      return;
    }
    if (allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Category "${trimmed}" already exists.`);
      return;
    }

    const added = dbStore.addCategory(trimmed);
    if (added) {
      setNewCategoryName('');
      setErrorMessage(null);
      setSuccessMessage(`Added "${trimmed}" to your categories.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onSelectCategory) {
        onSelectCategory(trimmed);
      }
    }
  };

  const handleDeleteCategory = (catName: string) => {
    const count = productCounts[catName] || 0;
    if (count > 0) {
      alert(`Cannot delete "${catName}" because it currently has ${count} product(s) assigned to it. Reassign or delete those products first.`);
      return;
    }

    if (window.confirm(`Delete category "${catName}"?`)) {
      dbStore.deleteCategory(catName);
    }
  };

  // Quick preset suggestions to click and add
  const suggestions = [
    'Beverages',
    'Organic Produce',
    'Apparel & Fashion',
    'Home & Kitchen',
    'Health & Beauty',
    'Electronics & Gadgets',
    'Books & Paper Goods',
    'Fine Wine & Spirits',
    'Art & Decor',
    'Snacks & Confectionery'
  ].filter((s) => !allCategories.some((c) => c.toLowerCase() === s.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 text-slate-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-serif">
                Product Categories
              </h2>
              <p className="text-xs text-slate-400">
                Create and organize custom product categories for your catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleAddCategory} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Add New Category
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Handmade Ceramics, Cold Beverages, Bakery..."
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setErrorMessage(null);
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {errorMessage && (
            <div className="text-rose-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-emerald-400 text-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Suggestions */}
          {suggestions.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 block mb-1.5 font-mono">
                QUICK SUGGESTIONS (CLICK TO ADD):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 5).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      dbStore.addCategory(sugg);
                      setSuccessMessage(`Added "${sugg}" to categories.`);
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Existing Categories ({allCategories.length})</span>
            <span className="font-mono">Products Assigned</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
            {allCategories.map((cat) => {
              const count = productCounts[cat] || 0;
              const isCustom = customCats.includes(cat);

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between py-2 px-3 bg-slate-950/60 rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400/80" />
                    <span className="text-sm font-medium text-slate-200">
                      {cat}
                    </span>
                    {isCustom && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {count} item{count !== 1 ? 's' : ''}
                    </span>

                    {isCustom && count === 0 && (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        title="Delete custom category"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
