import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Package, X } from 'lucide-react';

interface AddProductModalProps {
  dbState: DatabaseState;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ dbState, onClose }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(`89${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [category, setCategory] = useState('Gourmet Provisions');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Unit');
  const [costPrice, setCostPrice] = useState(15.00);
  const [retailPrice, setRetailPrice] = useState(32.00);
  const [wholesaleBasePrice, setWholesaleBasePrice] = useState(22.00);
  const [minWholesaleQty, setMinWholesaleQty] = useState(10);
  const [reorderThreshold, setReorderThreshold] = useState(25);
  const [initialStock, setInitialStock] = useState(100);
  const [locationId, setLocationId] = useState('loc_wh_central');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    dbStore.addProduct(
      {
        name,
        sku,
        barcode,
        category,
        description,
        unit,
        costPrice,
        retailPrice,
        wholesaleBasePrice,
        minWholesaleQty,
        taxRate: 0.0825,
        reorderThreshold,
        targetStockLevel: initialStock * 2
      },
      initialStock,
      locationId
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-5 space-y-4 text-slate-200 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Create New Product SKU</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Product Title / Brand Name:</label>
            <input
              type="text"
              placeholder="e.g. Single Origin Dark Roast Beans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">SKU Code:</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Barcode / EAN-13:</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              >
                <option value="Gourmet Provisions">Gourmet Provisions</option>
                <option value="Hardware & Tech">Hardware & Tech</option>
                <option value="Beverages & Dry Goods">Beverages & Dry Goods</option>
                <option value="Industrial Supplies">Industrial Supplies</option>
                <option value="Apparel & General">Apparel & General</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Packaging Unit:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit / Case / Sack"
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Description:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Commercial specifications and details..."
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            />
          </div>

          {/* Pricing Grid */}
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-2.5">
            <p className="font-semibold text-slate-300">Dual-Channel Pricing Structure</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Cost Price (COGS):</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Retail MSRP:</label>
                <input
                  type="number"
                  step="0.01"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Wholesale Base:</label>
                <input
                  type="number"
                  step="0.01"
                  value={wholesaleBasePrice}
                  onChange={(e) => setWholesaleBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Initial Inventory */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">Wholesale MOQ:</label>
              <input
                type="number"
                min="1"
                value={minWholesaleQty}
                onChange={(e) => setMinWholesaleQty(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Reorder Alert Level:</label>
              <input
                type="number"
                min="1"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Initial Stock Units:</label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
            >
              Register Product & Ingest Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
