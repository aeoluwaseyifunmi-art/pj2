import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import { Barcode, Search, X, CheckCircle, Package } from 'lucide-react';

interface BarcodeScannerModalProps {
  dbState: DatabaseState;
  onSelectProduct?: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  dbState,
  onSelectProduct,
  onClose
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [recentScans, setRecentScans] = useState<Product[]>([]);

  const handleScanInput = (code: string) => {
    setScannedCode(code);
    const trimmed = code.trim();
    if (!trimmed) {
      setMatchedProduct(null);
      return;
    }

    const prod = dbState.products.find(
      (p) =>
        p.barcode === trimmed ||
        p.sku.toLowerCase() === trimmed.toLowerCase() ||
        p.name.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (prod) {
      setMatchedProduct(prod);
      if (!recentScans.some((p) => p.id === prod.id)) {
        setRecentScans([prod, ...recentScans.slice(0, 4)]);
      }
    } else {
      setMatchedProduct(null);
    }
  };

  const handleSimulateScan = (prod: Product) => {
    handleScanInput(prod.barcode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Handheld Barcode & SKU Scanner</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Laser Scanner Visual Viewfinder */}
        <div className="relative h-28 bg-slate-950 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Animated Red Laser Line */}
          <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
          <div className="text-center space-y-1 z-10 pointer-events-none">
            <Barcode className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
            <p className="text-[11px] font-mono text-slate-400">Position barcode under laser target</p>
          </div>
        </div>

        {/* Input Field (acts like USB barcode scanner keystrokes) */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Scan or Type Barcode / SKU:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="e.g. 891024500112 or COF-ETH-YRG"
              value={scannedCode}
              onChange={(e) => handleScanInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Matched Product Card */}
        {matchedProduct ? (
          <div className="p-3 bg-slate-950/80 rounded border border-emerald-900/60 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Item Matched</span>
                </span>
                <p className="text-sm font-bold text-white mt-0.5">{matchedProduct.name}</p>
                <p className="text-xs font-mono text-slate-400">{matchedProduct.sku} · {matchedProduct.barcode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  ${matchedProduct.retailPrice.toFixed(2)}
                </p>
                <p className="text-[10px] font-mono text-blue-400">
                  WS: ${matchedProduct.wholesaleBasePrice.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Live Inventory Details by location */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
              {dbState.locations.map((loc) => {
                const stock = dbStore.getProductStock(matchedProduct.id, loc.id);
                return (
                  <div key={loc.id} className="p-1.5 bg-slate-900 rounded">
                    <p className="text-slate-400 text-[10px] truncate">{loc.code}</p>
                    <p className="font-bold text-white tabular-nums">{stock} units</p>
                  </div>
                );
              })}
            </div>

            {onSelectProduct && (
              <button
                onClick={() => {
                  onSelectProduct(matchedProduct);
                  onClose();
                }}
                className="w-full py-1.5 mt-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-xs transition-colors"
              >
                Add Scanned Item to Active Cart
              </button>
            )}
          </div>
        ) : scannedCode ? (
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-center text-xs text-slate-400">
            No product found matching barcode "{scannedCode}"
          </div>
        ) : null}

        {/* Quick Simulator Buttons */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">Quick Test Barcode Simulators:</p>
          <div className="flex flex-wrap gap-1.5">
            {dbState.products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSimulateScan(p)}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                {p.sku}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
