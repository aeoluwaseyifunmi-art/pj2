import React, { useState } from 'react';
import { Product } from '../../types/database';
import { Printer, Barcode, Check, X } from 'lucide-react';

interface BarcodePrintModalProps {
  products: Product[];
  onClose: () => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  products,
  onClose
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [labelCopies, setLabelCopies] = useState<number>(8);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [includeSku, setIncludeSku] = useState<boolean>(true);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const labelsHtml = Array.from({ length: labelCopies })
      .map(
        () => `
      <div class="label-card">
        <div class="store-name">OMNISTOCK RETAIL</div>
        <div class="prod-name">${selectedProduct?.name || 'Item'}</div>
        ${includeSku ? `<div class="sku-code">${selectedProduct?.sku || ''}</div>` : ''}
        <div class="barcode-bars">
          <!-- Scalable CSS Barcode Simulation -->
          <div class="bar w-2"></div><div class="bar w-1"></div><div class="bar w-3"></div>
          <div class="bar w-1"></div><div class="bar w-2"></div><div class="bar w-4"></div>
          <div class="bar w-1"></div><div class="bar w-3"></div><div class="bar w-2"></div>
          <div class="bar w-1"></div><div class="bar w-2"></div><div class="bar w-3"></div>
          <div class="bar w-2"></div><div class="bar w-1"></div><div class="bar w-4"></div>
          <div class="bar w-2"></div><div class="bar w-3"></div><div class="bar w-1"></div>
        </div>
        <div class="barcode-text">*${selectedProduct?.barcode || selectedProduct?.sku}*</div>
        ${includePrice ? `<div class="price-tag">$${(selectedProduct?.retailPrice || 0).toFixed(2)}</div>` : ''}
      </div>
    `
      )
      .join('');

    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Labels - ${selectedProduct?.name}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fff;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .label-card {
      border: 1px dashed #bbb;
      padding: 10px;
      text-align: center;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .store-name { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; color: #555; text-transform: uppercase; }
    .prod-name { font-size: 11px; font-weight: 600; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sku-code { font-family: monospace; font-size: 9px; color: #666; margin-top: 2px; }
    .barcode-bars {
      display: flex;
      justify-content: center;
      align-items: stretch;
      height: 36px;
      gap: 2px;
      margin: 6px 0 2px 0;
    }
    .bar { background: #000; }
    .w-1 { width: 1.5px; }
    .w-2 { width: 3px; }
    .w-3 { width: 4.5px; }
    .w-4 { width: 6px; }
    .barcode-text { font-family: monospace; font-size: 10px; letter-spacing: 0.15em; font-weight: 700; }
    .price-tag { font-family: monospace; font-size: 14px; font-weight: 800; margin-top: 4px; color: #111; }
    @media print {
      body { padding: 0; }
      .label-card { border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="grid">
    ${labelsHtml}
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Print Barcode & Shelf Price Labels</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Product SKU</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}] - ${p.retailPrice.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Label Copies to Print</label>
              <input
                type="number"
                min="1"
                max="100"
                value={labelCopies}
                onChange={(e) => setLabelCopies(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                <span>Include Retail Price</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSku}
                  onChange={(e) => setIncludeSku(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                <span>Include SKU Code</span>
              </label>
            </div>
          </div>

          {/* Label Preview Card */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 text-center space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Label Preview</div>
            <div className="p-3 bg-white text-slate-950 rounded-lg max-w-[220px] mx-auto shadow-sm">
              <div className="text-[8px] font-bold tracking-wider text-slate-600 uppercase">OMNISTOCK RETAIL</div>
              <div className="text-xs font-bold truncate mt-0.5">{selectedProduct?.name}</div>
              {includeSku && (
                <div className="font-mono text-[9px] text-slate-500">{selectedProduct?.sku}</div>
              )}
              {/* Simulated barcode */}
              <div className="flex justify-center items-center h-8 gap-0.5 my-1.5 px-2 bg-slate-50">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: `${(i % 3) + 1.5}px` }}
                  />
                ))}
              </div>
              <div className="font-mono text-[9px] tracking-widest font-semibold">
                *{selectedProduct?.barcode || selectedProduct?.sku}*
              </div>
              {includePrice && (
                <div className="font-mono text-base font-bold text-slate-950 mt-1">
                  ${selectedProduct?.retailPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {labelCopies} Sticker Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
