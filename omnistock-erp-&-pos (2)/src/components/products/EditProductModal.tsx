import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import { Edit3, X, DollarSign, Package, CheckCircle2, Trash2 } from 'lucide-react';
import { ProductImageUploader } from './ProductImageUploader';

interface EditProductModalProps {
  product: Product;
  dbState: DatabaseState;
  onClose: () => void;
  onProductDeleted?: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  dbState,
  onClose,
  onProductDeleted
}) => {
  const currentTotalStock = dbStore.getProductStock(product.id);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description || '');
  const [unit, setUnit] = useState(product.unit || 'Unit');
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');

  // Pricing
  const [retailPrice, setRetailPrice] = useState<number>(product.retailPrice);
  const [wholesalePrice, setWholesalePrice] = useState<number>(product.wholesaleBasePrice);
  const [costPrice, setCostPrice] = useState<number>(product.costPrice);
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(product.minWholesaleQty || 5);

  // Stock
  const [newStock, setNewStock] = useState<number>(currentTotalStock);
  const [reorderThreshold, setReorderThreshold] = useState<number>(product.reorderThreshold);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const profitPerUnit = retailPrice - costPrice;
  const marginPercent = retailPrice > 0 ? ((profitPerUnit / retailPrice) * 100).toFixed(1) : '0';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    dbStore.updateProduct(
      product.id,
      {
        name: name.trim(),
        category,
        description: description.trim(),
        unit,
        imageUrl: imageUrl.trim() || undefined,
        retailPrice: Number(retailPrice) || 0,
        wholesaleBasePrice: Number(wholesalePrice) || Number(retailPrice),
        costPrice: Number(costPrice) || 0,
        minWholesaleQty: Number(minWholesaleQty) || 5,
        reorderThreshold: Number(reorderThreshold) || 10
      },
      newStock !== currentTotalStock
        ? { locationId: 'loc_store_flagship', newStock: Number(newStock) }
        : undefined
    );

    onClose();
  };

  const handleDelete = () => {
    if (confirmDelete) {
      dbStore.deleteProduct(product.id);
      if (onProductDeleted) onProductDeleted();
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 text-slate-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Edit Product Details</h3>
              <p className="text-xs text-slate-400">Update selling prices, inventory, and product info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block text-xs">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Category</label>
              <input
                type="text"
                list="edit-category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or enter category..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <datalist id="edit-category-options">
                {dbStore.getCategories().map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          {/* Product Image Selection & Upload */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <ProductImageUploader imageUrl={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Pricing Grid */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Selling Prices & Margins
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Est. Profit: ${profitPerUnit > 0 ? profitPerUnit.toFixed(2) : '0.00'} ({marginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Retail Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-bold font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Wholesale ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Stock & Reorder */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Total Stock on Hand</label>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Low Stock Alert</label>
              <input
                type="number"
                min="1"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block text-xs">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Yes, Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs cursor-pointer py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Product</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
