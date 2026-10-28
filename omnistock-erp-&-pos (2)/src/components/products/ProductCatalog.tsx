import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product } from '../../types/database';
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Grid,
  List,
  Layers,
  MapPin,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { AddProductSellModal } from './AddProductSellModal';
import { EditProductModal } from './EditProductModal';
import { CategoryManagerModal } from './CategoryManagerModal';

interface ProductCatalogProps {
  dbState: DatabaseState;
  onNavigateToPosWithProduct?: (productId: string) => void;
  onOpenLocationManager?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  dbState,
  onNavigateToPosWithProduct,
  onOpenLocationManager
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Active location
  const activeLocationId = dbStore.getActiveLocationId();
  const activeLocation = dbState.locations.find((l) => l.id === activeLocationId) || dbState.locations[0];

  // Categories list from store
  const allCategories = useMemo(() => {
    return dbStore.getCategories();
  }, [dbState.products, dbState.customCategories]);

  // Category counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: dbState.products.length };
    allCategories.forEach((c) => {
      counts[c] = 0;
    });
    dbState.products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [dbState.products, allCategories]);

  const categoryPills = ['All', ...allCategories];

  // Filtered products list (Search by product name, category, or description — NO BARCODE NEEDED)
  const filteredProducts = useMemo(() => {
    return dbState.products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Stock filter
      const stock = dbStore.getProductStock(product.id);
      if (stockFilter === 'in_stock' && stock <= 0) return false;
      if (stockFilter === 'low_stock' && (stock > product.reorderThreshold || stock === 0)) return false;
      if (stockFilter === 'out_of_stock' && stock > 0) return false;

      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(q);
        const matchCat = product.category.toLowerCase().includes(q);
        const matchDesc = (product.description || '').toLowerCase().includes(q);
        const matchSku = (product.sku || '').toLowerCase().includes(q);
        return matchName || matchCat || matchDesc || matchSku;
      }

      return true;
    });
  }, [dbState.products, selectedCategory, stockFilter, searchQuery, dbState.inventory]);

  // Overall catalog metrics
  const catalogStats = useMemo(() => {
    let totalStockUnits = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outStockCount = 0;

    dbState.products.forEach((p) => {
      const stock = dbStore.getProductStock(p.id);
      totalStockUnits += stock;
      totalRetailValue += stock * p.retailPrice;
      if (stock === 0) outStockCount++;
      else if (stock <= p.reorderThreshold) lowStockCount++;
    });

    const avgPrice =
      dbState.products.length > 0
        ? dbState.products.reduce((acc, p) => acc + p.retailPrice, 0) / dbState.products.length
        : 0;

    return {
      totalProducts: dbState.products.length,
      totalStockUnits,
      totalRetailValue,
      lowStockCount,
      outStockCount,
      avgPrice
    };
  }, [dbState.products, dbState.inventory]);

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to remove this product from your selling catalog?')) {
      dbStore.deleteProduct(productId);
    }
  };

  const handleClearAllProducts = () => {
    if (window.confirm('Clear all demo products? You can then manually add your own products from scratch. (You can also reset to demo anytime using the top reset button).')) {
      dbStore.clearAllProducts();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Heading (Editorial Typography) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400 tracking-widest uppercase mb-1">
            <span>CATALOG & PRICING REGISTRY</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-300">
              <MapPin className="w-3 h-3" />
              {activeLocation?.name}
            </span>
          </div>
          <h1 className="text-3xl font-normal font-serif text-white tracking-tight">
            Products I Sell
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Directly manage your goods, set retail and wholesale prices, attach photos, and assign custom categories — without needing barcodes.
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenLocationManager && (
            <button
              onClick={onOpenLocationManager}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Change / Add Location</span>
            </button>
          )}

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:text-amber-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>

          {dbState.products.length > 0 && (
            <button
              onClick={handleClearAllProducts}
              title="Clear demo items to start with an empty catalog for your own products"
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Listed Products</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {catalogStats.totalProducts}
          </div>
          <div className="text-[11px] text-slate-400">Available to sell</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Stock on Hand</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
            {catalogStats.totalStockUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Units in inventory</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Catalog Retail Value</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
            ${catalogStats.totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">At active retail rates</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stock Status</span>
            {catalogStats.lowStockCount > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {Math.max(0, catalogStats.totalProducts - catalogStats.lowStockCount - catalogStats.outStockCount)}
            </span>
            <span className="text-xs text-slate-400">healthy</span>
          </div>
          <div className="text-[11px] text-amber-400">
            {catalogStats.lowStockCount > 0 ? `${catalogStats.lowStockCount} items need restock` : 'Inventory levels optimal'}
          </div>
        </div>
      </div>

      {/* Search, Categories & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar: searches by title, category, description, or SKU */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, category, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & View switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock (Reorder)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid cards view"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills + Add Category Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categoryPills.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoriesWithCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-800 text-amber-100' : 'bg-slate-800 text-slate-400 font-mono'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-2.5 py-1.5 rounded-md whitespace-nowrap text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-800/60 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Category</span>
          </button>
        </div>
      </div>

      {/* Product List Content */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="w-14 h-14 bg-slate-800 text-amber-400 rounded-2xl mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-serif">
              {dbState.products.length === 0 ? 'Your Sell Catalog is Empty' : 'No products match your search'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {dbState.products.length === 0
                ? 'Click the button below to manually add your first product with name, price, stock, and image.'
                : searchQuery
                ? `No products found matching "${searchQuery}". Clear your search or add this item.`
                : 'There are currently no products listed in this category.'}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product to Sell</span>
            </button>

            {dbState.products.length === 0 && (
              <button
                onClick={() => dbStore.resetToFactory()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <span>Load Sample Products</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW (Editorial Style) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const stock = dbStore.getProductStock(product.id);
            const isLow = stock > 0 && stock <= product.reorderThreshold;
            const isOut = stock === 0;
            const profit = product.retailPrice - product.costPrice;
            const margin = product.retailPrice > 0 ? ((profit / product.retailPrice) * 100).toFixed(0) : '0';

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all shadow-sm group hover:shadow-md"
              >
                {/* Image Box & Meta Code */}
                <div className="aspect-4/3 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-800/80">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-1.5 p-4 text-center">
                      <Package className="w-8 h-8 opacity-30" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        {product.category}
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-amber-300 border border-amber-500/20">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-mono ${
                        isOut
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                          : isLow
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {stock} in stock
                    </span>
                  </div>

                  {/* SKU Tag */}
                  <div className="absolute bottom-2 left-2.5 text-[10px] font-mono text-slate-300/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {product.sku}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-semibold text-white text-base tracking-tight leading-snug">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Retail Price</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          ${product.retailPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Wholesale</span>
                        <span className="text-sm font-bold font-mono text-cyan-300">
                          ${product.wholesaleBasePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80 font-mono">
                      <span>Cost: ${product.costPrice.toFixed(2)}</span>
                      <span className="text-emerald-400 font-semibold">
                        Margin: +{margin}%
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingProduct(product)}
                          title="Edit product details & image"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Remove from sell catalog"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {onNavigateToPosWithProduct && (
                        <button
                          onClick={() => onNavigateToPosWithProduct(product.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Sell</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Product Name & Category</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Wholesale Price</th>
                  <th className="py-3 px-4">Cost & Margin</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((product) => {
                  const stock = dbStore.getProductStock(product.id);
                  const isLow = stock > 0 && stock <= product.reorderThreshold;
                  const isOut = stock === 0;
                  const profit = product.retailPrice - product.costPrice;
                  const margin = product.retailPrice > 0 ? ((profit / product.retailPrice) * 100).toFixed(0) : '0';

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Name & Category with Image Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-500 opacity-60" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm tracking-tight">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium font-mono">
                                {product.category}
                              </span>
                              {product.description && (
                                <span className="text-slate-400 text-[11px] truncate max-w-xs">
                                  {product.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {product.sku}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ${product.retailPrice.toFixed(2)}
                      </td>

                      {/* Wholesale Price */}
                      <td className="py-3.5 px-4 font-mono text-cyan-300">
                        ${product.wholesaleBasePrice.toFixed(2)}
                        <span className="text-[10px] text-slate-400 block font-sans">
                          MOQ: {product.minWholesaleQty} units
                        </span>
                      </td>

                      {/* Cost & Margin */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-300">
                          ${product.costPrice.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium block font-mono">
                          +${profit.toFixed(2)} ({margin}%)
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOut
                                ? 'text-rose-400'
                                : isLow
                                ? 'text-amber-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {stock}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isOut
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {product.unit}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onNavigateToPosWithProduct && (
                            <button
                              onClick={() => onNavigateToPosWithProduct(product.id)}
                              title="Ring up in POS Terminal"
                              className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Sell</span>
                            </button>
                          )}

                          <button
                            onClick={() => setEditingProduct(product)}
                            title="Edit Product & Prices"
                            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            title="Remove from Sell Catalog"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductSellModal
          dbState={dbState}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          dbState={dbState}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <CategoryManagerModal
          dbState={dbState}
          onClose={() => setShowCategoryModal(false)}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      )}
    </div>
  );
};
