import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import { ArrowRightLeft, X, AlertTriangle } from 'lucide-react';

interface StockTransferModalProps {
  dbState: DatabaseState;
  product?: Product | null;
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  dbState,
  product: initialProduct,
  onClose
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct ? initialProduct.id : dbState.products[0]?.id || ''
  );
  const [fromLocationId, setFromLocationId] = useState<string>('loc_wh_central');
  const [toLocationId, setToLocationId] = useState<string>('loc_store_flagship');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Storefront replenishment for weekend volume');
  const [operator, setOperator] = useState<string>('Inventory Logistics Supervisor');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentProduct = dbState.products.find((p) => p.id === selectedProductId);
  const sourceStock = dbStore.getProductStock(selectedProductId, fromLocationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (quantity <= 0) {
      setErrorMessage('Transfer quantity must be greater than zero.');
      return;
    }

    const result = dbStore.transferStock(
      selectedProductId,
      fromLocationId,
      toLocationId,
      quantity,
      reason,
      operator
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Transfer failed.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Inter-Location Stock Transfer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Product selector */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Select SKU / Product:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden"
            >
              {dbState.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">From (Source):</label>
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              >
                {dbState.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-mono text-emerald-400 pt-0.5">
                Available: {sourceStock} {currentProduct?.unit}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">To (Destination):</label>
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              >
                {dbState.locations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === fromLocationId}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-slate-400">Transfer Units:</label>
            <input
              type="number"
              min="1"
              max={sourceStock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-sm"
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-slate-400">Reason / Reference:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              required
            />
          </div>

          {/* Operator */}
          <div className="space-y-1">
            <label className="text-slate-400">Authorized Operator:</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              required
            />
          </div>

          {/* Actions */}
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
              Execute Stock Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
