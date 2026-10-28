import React, { useState } from 'react';
import { DatabaseState, dbStore } from '../../db/databaseStore';
import { PurchaseOrder, PurchaseOrderItem } from '../../types/database';
import {
  Package,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Building,
  DollarSign,
  Search,
  Filter,
  FileText,
  Printer,
  ChevronDown,
  Trash2,
  Calendar
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportUtils';

interface PurchaseOrdersProps {
  dbState: DatabaseState;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ dbState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO Form State
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState(
    dbState.locations[0]?.id || ''
  );
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([{ productId: dbState.products[0]?.id || '', quantity: 50, unitCost: dbState.products[0]?.costPrice || 10 }]);

  const purchaseOrders = dbState.purchaseOrders || [];

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.destinationLocationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItemRow = () => {
    const firstProd = dbState.products[0];
    setPoItems([
      ...poItems,
      { productId: firstProd?.id || '', quantity: 20, unitCost: firstProd?.costPrice || 10 }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (
    idx: number,
    field: 'productId' | 'quantity' | 'unitCost',
    value: any
  ) => {
    const updated = [...poItems];
    if (field === 'productId') {
      const prod = dbState.products.find((p) => p.id === value);
      updated[idx].productId = value;
      if (prod) {
        updated[idx].unitCost = prod.costPrice;
      }
    } else if (field === 'quantity') {
      updated[idx].quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === 'unitCost') {
      updated[idx].unitCost = Math.max(0, parseFloat(value) || 0);
    }
    setPoItems(updated);
  };

  const totalCalculatedCost = poItems.reduce(
    (sum, it) => sum + it.quantity * it.unitCost,
    0
  );

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Please enter a supplier or vendor name.');
      return;
    }
    if (poItems.length === 0) {
      alert('Please add at least one line item to the purchase order.');
      return;
    }

    const destLoc =
      dbState.locations.find((l) => l.id === destinationLocationId) || dbState.locations[0];

    const formattedItems: PurchaseOrderItem[] = poItems.map((it) => {
      const prod = dbState.products.find((p) => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod?.name || 'Catalog Item',
        sku: prod?.sku || 'SKU-UNKNOWN',
        quantity: it.quantity,
        unitCost: it.unitCost,
        receivedQuantity: 0
      };
    });

    const randomNum = Math.floor(100 + Math.random() * 900);
    const poNumber = `PO-2026-${randomNum}`;

    dbStore.createPurchaseOrder({
      poNumber,
      supplierName: supplierName.trim(),
      supplierEmail: supplierEmail.trim() || undefined,
      supplierContact: supplierContact.trim() || undefined,
      destinationLocationId: destLoc.id,
      destinationLocationName: destLoc.name,
      items: formattedItems,
      totalCost: totalCalculatedCost,
      expectedDeliveryDate: expectedDate,
      notes: poNotes.trim() || undefined,
      createdBy: 'Inventory Director'
    });

    setShowCreateModal(false);
    // Reset form
    setSupplierName('');
    setSupplierEmail('');
    setSupplierContact('');
    setPoNotes('');
    setPoItems([
      { productId: dbState.products[0]?.id || '', quantity: 50, unitCost: dbState.products[0]?.costPrice || 10 }
    ]);
  };

  const handleReceivePO = (po: PurchaseOrder) => {
    if (
      window.confirm(
        `Confirm receipt of ${po.poNumber} from ${po.supplierName}? This will immediately stock ${po.items.reduce((s, i) => s + i.quantity, 0)} units into "${po.destinationLocationName}".`
      )
    ) {
      const result = dbStore.receivePurchaseOrder(po.id, 'Warehouse Receiving Staff');
      alert(result.message);
    }
  };

  const handleCancelPO = (po: PurchaseOrder) => {
    if (window.confirm(`Are you sure you want to cancel purchase order ${po.poNumber}?`)) {
      dbStore.cancelPurchaseOrder(po.id, 'User cancelled');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              Purchase Orders & Supplier Inbound
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 rounded">
              {purchaseOrders.length} POs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage vendor purchase orders, delivery tracking, and 1-click warehouse intake with ledger movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const exportRows = purchaseOrders.map((po) => ({
                poNumber: po.poNumber,
                supplier: po.supplierName,
                destination: po.destinationLocationName,
                status: po.status,
                itemsCount: po.items.length,
                totalCost: po.totalCost,
                createdAt: po.createdAt,
                expectedDelivery: po.expectedDeliveryDate || 'N/A'
              }));
              exportToCsv(`Purchase_Orders_${new Date().toISOString().slice(0, 10)}`, exportRows);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PO#, supplier, or warehouse..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          {['all', 'ordered', 'received', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* PO List Cards / Table */}
      <div className="space-y-3">
        {filteredPOs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No purchase orders matching your search criteria.
          </div>
        ) : (
          filteredPOs.map((po) => {
            const isReceived = po.status === 'received';
            const isOrdered = po.status === 'ordered';
            const isCancelled = po.status === 'cancelled';

            return (
              <div
                key={po.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      {po.poNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        isReceived
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isOrdered
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isReceived && <CheckCircle2 className="w-3 h-3" />}
                      {isOrdered && <Clock className="w-3 h-3 animate-pulse" />}
                      {isCancelled && <XCircle className="w-3 h-3" />}
                      {po.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
                    <span className="text-white font-semibold">{po.supplierName}</span>
                    {po.supplierEmail && (
                      <span className="text-slate-500 font-mono text-[11px]">
                        ({po.supplierEmail})
                      </span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-cyan-400 flex items-center gap-1 text-[11px]">
                      <Building className="w-3 h-3" />
                      {po.destinationLocationName}
                    </span>
                  </div>

                  {/* Line Items Summary */}
                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-2 pt-1">
                    {po.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                      >
                        {it.productName.slice(0, 24)}... × {it.quantity} @ ${it.unitCost.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Actions & Financials */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Total Value</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      ${po.totalCost.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOrdered && (
                      <>
                        <button
                          onClick={() => handleReceivePO(po)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receive Stock</span>
                        </button>

                        <button
                          onClick={() => handleCancelPO(po)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          title="Cancel PO"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isReceived && (
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        <div className="text-emerald-400 font-semibold">Stocked</div>
                        <div>{new Date(po.receivedAt || po.createdAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Purchase Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Issue New Supplier Purchase Order
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePO} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Supplier / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Addis Highland Growers Co."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Supplier Email</label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="orders@supplier.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Destination Location *</label>
                  <select
                    value={destinationLocationId}
                    onChange={(e) => setDestinationLocationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {dbState.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-200">PO Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Add SKU
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg"
                    >
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      >
                        {dbState.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.sku}]
                          </option>
                        ))}
                      </select>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-right"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          placeholder="Unit Cost"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={poItems.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-3">
                  <span className="text-slate-400">Total Purchase Commitment:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    ${totalCalculatedCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Instructions</label>
                <textarea
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Inbound shipment dock 4 delivery instructions"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer shadow-sm"
                >
                  Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
