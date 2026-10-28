import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import { SlidersHorizontal, X } from 'lucide-react';

interface StockAdjustModalProps {
  dbState: DatabaseState;
  product?: Product | null;
  locationId?: string;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  dbState,
  product: initialProduct,
  locationId: initialLocationId,
  onClose
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct ? initialProduct.id : dbState.products[0]?.id || ''
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    initialLocationId || dbState.locations[0]?.id || ''
  );

  const currentProduct = dbState.products.find((p) => p.id === selectedProductId);
  const currentStock = dbStore.getProductStock(selectedProductId, selectedLocationId);

  const [newQuantity, setNewQuantity] = useState<number>(currentStock);
  const [reason, setReason] = useState<string>('Cycle Count Reconciliation');
  const [operator, setOperator] = useState<string>('Inventory Auditor');

  const diff = newQuantity - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.adjustStock(selectedProductId, selectedLocationId, newQuantity, reason, operator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Physical Inventory Adjustment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400">Product / SKU:</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const s = dbStore.getProductStock(e.target.value, selectedLocationId);
                setNewQuantity(s);
              }}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            >
              {dbState.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Facility Location:</label>
            <select
              value={selectedLocationId}
              onChange={(e) => {
                setSelectedLocationId(e.target.value);
                const s = dbStore.getProductStock(selectedProductId, e.target.value);
                setNewQuantity(s);
              }}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            >
              {dbState.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded border border-slate-800">
            <div>
              <p className="text-slate-400">Recorded System Stock:</p>
              <p className="font-mono text-base font-bold text-slate-200 tabular-nums">
                {currentStock} {currentProduct?.unit}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Variance Delta:</p>
              <p
                className={`font-mono text-base font-bold tabular-nums ${
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} units
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Actual Counted Physical Stock:</label>
            <input
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Adjustment Reason Code:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            >
              <option value="Cycle Count Reconciliation">Cycle Count Reconciliation</option>
              <option value="Damaged / Breakage in Warehouse">Damaged / Breakage in Warehouse</option>
              <option value="Expired Shelf Life Write-off">Expired Shelf Life Write-off</option>
              <option value="Supplier Overage on Receiving">Supplier Overage on Receiving</option>
              <option value="Customer Return to Stock">Customer Return to Stock</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Auditor Name:</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              required
            />
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
              Save Count & Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
