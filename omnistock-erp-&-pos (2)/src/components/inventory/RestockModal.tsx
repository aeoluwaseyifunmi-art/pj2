import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import { PackagePlus, X } from 'lucide-react';

interface RestockModalProps {
  dbState: DatabaseState;
  product?: Product | null;
  onClose: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  dbState,
  product: initialProduct,
  onClose
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct ? initialProduct.id : dbState.products[0]?.id || ''
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc_wh_central');
  const [quantity, setQuantity] = useState<number>(50);
  const [batchLot, setBatchLot] = useState<string>(`LOT-2026-${Date.now().toString().slice(-4)}`);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>(`PO-INB-${Date.now().toString().slice(-4)}`);
  const [reason, setReason] = useState<string>('Supplier Delivery Container Inbound');
  const [operator, setOperator] = useState<string>('Receiving Dock Officer');

  const currentProduct = dbState.products.find((p) => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.restockProduct(
      selectedProductId,
      selectedLocationId,
      quantity,
      batchLot,
      expiryDate || undefined,
      poNumber,
      reason,
      operator
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Receive Inbound Restock (PO)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400">Target Product / SKU:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            >
              {dbState.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Receiving Facility:</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              >
                {dbState.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Inbound Units:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Batch / Lot Number:</label>
              <input
                type="text"
                value={batchLot}
                onChange={(e) => setBatchLot(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Expiry Date (Optional):</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">Purchase Order #:</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Receiving Officer:</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Total Inbound Inventory Value (at cost):</span>
            <span className="font-mono text-emerald-400 font-bold tabular-nums">
              ${((currentProduct?.costPrice || 0) * quantity).toFixed(2)}
            </span>
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
              Receive & Ingest Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
