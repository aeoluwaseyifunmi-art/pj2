import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { PackagePlus, X, DollarSign, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { ProductImageUploader } from './ProductImageUploader';

interface AddProductSellModalProps {
  dbState: DatabaseState;
  onClose: () => void;
  onProductAdded?: (productId: string) => void;
}

export const AddProductSellModal: React.FC<AddProductSellModalProps> = ({
  dbState,
  onClose,
  onProductAdded
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Provisions & Groceries');
  const [customCategory, setCustomCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Unit');
  const [imageUrl, setImageUrl] = useState('');

  // Pricing
  const [retailPrice, setRetailPrice] = useState<number>(25.0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(18.0);
  const [costPrice, setCostPrice] = useState<number>(12.0);
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(10);

  // Stock
  const [initialStock, setInitialStock] = useState<number>(50);
  const [reorderThreshold, setReorderThreshold] = useState<number>(15);
  const [locationId, setLocationId] = useState<string>(
    dbState.locations[0]?.id || 'loc_store_flagship'
  );

  // Existing categories from store
  const existingCategories = dbStore.getCategories();

  // Calculate profit margin & markup
  const profitPerUnit = retailPrice - costPrice;
  const marginPercent = retailPrice > 0 ? ((profitPerUnit / retailPrice) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isNewCategory && customCategory.trim() ? customCategory.trim() : category;
    if (isNewCategory && customCategory.trim()) {
      dbStore.addCategory(customCategory.trim());
    }

    // Generate internal clean reference code automatically so the user never touches barcodes
    const generatedSku = `ITEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const internalBarcode = `89${Date.now().toString().slice(-8)}`;

    const newProd = dbStore.addProduct(
      {
        name: name.trim(),
        sku: generatedSku,
        barcode: internalBarcode,
        category: finalCategory,
        description: description.trim() || 'Active product in sell catalog',
        unit,
        imageUrl: imageUrl.trim() || undefined,
        costPrice: Number(costPrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        wholesaleBasePrice: Number(wholesalePrice) || Number(retailPrice),
        minWholesaleQty: Number(minWholesaleQty) || 5,
        taxRate: 0.0825,
        reorderThreshold: Number(reorderThreshold) || 10,
        targetStockLevel: Math.max(Number(initialStock) * 2, 50)
      },
      Number(initialStock) || 0,
      locationId
    );

    if (onProductAdded) {
      onProductAdded(newProd.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 text-slate-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add Product You Sell</h3>
              <p className="text-xs text-slate-400">
                Register a new retail or wholesale item in your sell catalog
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block text-xs">
              Product Name / Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arabica Roast Whole Coffee, Leather Tote Bag, Olive Oil 500ml"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold block text-xs">Category</label>
                <button
                  type="button"
                  onClick={() => setIsNewCategory(!isNewCategory)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  {isNewCategory ? 'Pick existing' : '+ New category'}
                </button>
              </div>

              {isNewCategory ? (
                <input
                  type="text"
                  placeholder="Enter new category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Unit of Sale</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Unit">Unit (pcs)</option>
                <option value="Bottle">Bottle</option>
                <option value="Box">Box / Carton</option>
                <option value="Pack">Pack</option>
                <option value="Bag">Bag</option>
                <option value="Kg">Kilogram (kg)</option>
                <option value="Lb">Pound (lb)</option>
                <option value="Case">Case (12ct / 24ct)</option>
              </select>
            </div>
          </div>

          {/* Product Image Selection & Upload */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <ProductImageUploader imageUrl={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Pricing Section */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Selling Prices & Profit Margin
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Est. Profit: ${profitPerUnit > 0 ? profitPerUnit.toFixed(2) : '0.00'} ({marginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Retail Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-bold font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Wholesale Bulk Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Cost Price / Buy Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Initial Stock & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Initial Quantity in Stock</label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Low Stock Alert Level</label>
              <input
                type="number"
                min="1"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">Store / Warehouse</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              >
                {dbState.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block text-xs">
              Product Description / Sales Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Flavor notes, dimensions, batch details, or special selling recommendations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Add to Sell List</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
