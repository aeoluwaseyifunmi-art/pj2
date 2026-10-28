import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import {
  Package,
  ArrowRightLeft,
  SlidersHorizontal,
  PackagePlus,
  Plus,
  Search,
  Download,
  AlertTriangle,
  History,
  Grid
} from 'lucide-react';
import { StockTransferModal } from './StockTransferModal';
import { StockAdjustModal } from './StockAdjustModal';
import { RestockModal } from './RestockModal';
import { AddProductModal } from './AddProductModal';

interface InventoryManagerProps {
  dbState: DatabaseState;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ dbState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'movements'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockHealthFilter, setStockHealthFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  // Compute metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    dbState.products.forEach((p) => {
      const stock = dbStore.getProductStock(p.id, selectedLocation === 'all' ? undefined : selectedLocation);
      totalUnits += stock;
      totalCostValuation += stock * p.costPrice;
      totalRetailValuation += stock * p.retailPrice;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= p.reorderThreshold) {
        lowStockCount++;
      }
    });

    return {
      totalSkus: dbState.products.length,
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      lowStockCount,
      outOfStockCount
    };
  }, [dbState.products, dbState.inventory, selectedLocation]);

  // Categories
  const categories = useMemo(() => {
    const s = new Set<string>();
    dbState.products.forEach((p) => s.add(p.category));
    return ['All', ...Array.from(s)];
  }, [dbState.products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return dbState.products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);

      const stock = dbStore.getProductStock(
        p.id,
        selectedLocation === 'all' ? undefined : selectedLocation
      );
      let matchHealth = true;
      if (stockHealthFilter === 'low') {
        matchHealth = stock <= p.reorderThreshold && stock > 0;
      } else if (stockHealthFilter === 'out') {
        matchHealth = stock === 0;
      }

      return matchCat && matchQuery && matchHealth;
    });
  }, [dbState.products, dbState.inventory, selectedCategory, searchQuery, selectedLocation, stockHealthFilter]);

  // Export Inventory CSV
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Unit',
      'Cost Price',
      'Retail Price',
      'Wholesale Price',
      'Total Stock',
      'Cost Valuation'
    ];

    const rows = filteredProducts.map((p) => {
      const stock = dbStore.getProductStock(p.id);
      return [
        p.sku,
        p.barcode,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.unit,
        p.costPrice.toFixed(2),
        p.retailPrice.toFixed(2),
        p.wholesaleBasePrice.toFixed(2),
        stock,
        (stock * p.costPrice).toFixed(2)
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Real-Time Inventory Hub</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-facility stock matrix, reorder points, warehouse-to-store transfers, and audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTransferProduct(null);
              setShowTransferModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transfer Stock</span>
          </button>

          <button
            onClick={() => {
              setRestockProduct(null);
              setShowRestockModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Receive Restock</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Total Physical Units</p>
          <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
            {metrics.totalUnits.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {metrics.totalSkus} Active Master SKUs
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Inventory Valuation (Cost)</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            ${metrics.totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            COGS Book Value
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Potential Retail Asset Value</p>
          <p className="text-2xl font-bold font-mono text-slate-200 tabular-nums mt-1">
            ${metrics.totalRetailValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            MSRP Gross Potential
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Stockout & Reorder Risk</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {metrics.lowStockCount}
            </span>
            <span className="text-xs text-slate-400">low</span>
            <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums ml-2">
              {metrics.outOfStockCount}
            </span>
            <span className="text-xs text-slate-400">depleted</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Below target reorder threshold</p>
        </div>
      </div>

      {/* View Switcher & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
        {/* Sub-view switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-md">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTab === 'matrix'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Location Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeSubTab === 'movements'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Ledger</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Locations (Consolidated)</option>
            {dbState.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Health Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded">
            <button
              onClick={() => setStockHealthFilter('all')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                stockHealthFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockHealthFilter('low')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                stockHealthFilter === 'low' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Reorder
            </button>
            <button
              onClick={() => setStockHealthFilter('out')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                stockHealthFilter === 'out' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Sold Out
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter SKU or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden w-44"
            />
          </div>

          <button
            onClick={handleExportCsv}
            title="Download Inventory CSV"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* SUBVIEW 1: Real-Time Location Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4">Product Name & Category</th>
                  <th className="py-3 px-4 text-center">Unit / MOQ</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Retail</th>
                  <th className="py-3 px-4 text-right">Wholesale</th>
                  {selectedLocation === 'all' ? (
                    <>
                      <th className="py-3 px-3 text-right">CDC Whse</th>
                      <th className="py-3 px-3 text-right">Flagship</th>
                      <th className="py-3 px-3 text-right">Northside</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-200">Total Stock</th>
                    </>
                  ) : (
                    <th className="py-3 px-4 text-right font-bold text-slate-200">Facility Stock</th>
                  )}
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredProducts.map((prod) => {
                  const stockWh = dbStore.getProductStock(prod.id, 'loc_wh_central');
                  const stockFlg = dbStore.getProductStock(prod.id, 'loc_store_flagship');
                  const stockNor = dbStore.getProductStock(prod.id, 'loc_store_northside');
                  const totalStock = dbStore.getProductStock(
                    prod.id,
                    selectedLocation === 'all' ? undefined : selectedLocation
                  );

                  const isLow = totalStock <= prod.reorderThreshold && totalStock > 0;
                  const isOut = totalStock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* SKU / Barcode */}
                      <td className="py-3 px-4 font-mono">
                        <p className="text-slate-100 font-medium">{prod.sku}</p>
                        <p className="text-[11px] text-slate-400">{prod.barcode}</p>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200 line-clamp-1">{prod.name}</p>
                        <p className="text-[11px] text-slate-400">{prod.category}</p>
                      </td>

                      {/* Unit / MOQ */}
                      <td className="py-3 px-4 text-center text-slate-300">
                        <span>{prod.unit}</span>
                        <span className="text-slate-400 text-[11px] block">
                          MOQ: {prod.minWholesaleQty}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        ${prod.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400 font-medium">
                        ${prod.retailPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-400">
                        ${prod.wholesaleBasePrice.toFixed(2)}
                      </td>

                      {/* Stock columns */}
                      {selectedLocation === 'all' ? (
                        <>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                            {stockWh}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                            {stockFlg}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                            {stockNor}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white text-sm">
                            {totalStock}
                          </td>
                        </>
                      ) : (
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white text-sm">
                          {totalStock}
                        </td>
                      )}

                      {/* Stock Status (Unboxed text with typographic discipline) */}
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="text-rose-400 font-mono font-medium text-[11px]">
                            Depleted
                          </span>
                        ) : isLow ? (
                          <span className="text-amber-400 font-mono text-[11px]">
                            Reorder · {totalStock} left
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-mono text-[11px]">
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setTransferProduct(prod);
                              setShowTransferModal(true);
                            }}
                            title="Transfer stock to another location"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustProduct(prod);
                              setShowAdjustModal(true);
                            }}
                            title="Adjust physical count"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRestockProduct(prod);
                              setShowRestockModal(true);
                            }}
                            title="Receive Inbound Restock"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-colors"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: Stock Movements Audit Ledger */}
      {activeSubTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Audit Trail · Real-Time Stock Transactions ({dbState.stockMovements.length} logged events)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Synchronized automatically on each transaction
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                  <th className="py-3 px-4 text-right">Prev → New</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4">Reason & Notes</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {dbState.stockMovements.map((sm) => {
                  const product = dbState.products.find((p) => p.id === sm.productId);
                  const location = dbState.locations.find((l) => l.id === sm.locationId);

                  const isNegative = sm.quantityChange < 0;

                  return (
                    <tr key={sm.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                        {new Date(sm.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono uppercase text-[11px] text-slate-200">
                          {sm.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-200 line-clamp-1">
                          {product?.name || sm.productId}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">{product?.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {location?.name || sm.locationId}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold tabular-nums ${
                          isNegative ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isNegative ? sm.quantityChange : `+${sm.quantityChange}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                        {sm.previousQty} → {sm.newQty}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">{sm.referenceNumber}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{sm.reason}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{sm.operator}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTransferModal && (
        <StockTransferModal
          dbState={dbState}
          product={transferProduct}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {showAdjustModal && (
        <StockAdjustModal
          dbState={dbState}
          product={adjustProduct}
          onClose={() => setShowAdjustModal(false)}
        />
      )}

      {showRestockModal && (
        <RestockModal
          dbState={dbState}
          product={restockProduct}
          onClose={() => setShowRestockModal(false)}
        />
      )}

      {showAddModal && (
        <AddProductModal dbState={dbState} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};
