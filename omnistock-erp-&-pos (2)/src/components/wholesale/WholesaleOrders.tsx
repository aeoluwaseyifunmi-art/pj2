import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Order, Customer, PriceTier } from '../../types/database';
import {
  Building2,
  FileText,
  UserPlus,
  Percent,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

interface WholesaleOrdersProps {
  dbState: DatabaseState;
  onNavigateToPos: () => void;
}

export const WholesaleOrders: React.FC<WholesaleOrdersProps> = ({ dbState, onNavigateToPos }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers' | 'tiers'>('invoices');

  // New customer modal
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustTaxId, setNewCustTaxId] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(15000);
  const [newCustTerms, setNewCustTerms] = useState<'net15' | 'net30' | 'net60'>('net30');

  // Filter wholesale orders
  const wholesaleOrders = dbState.orders.filter((o) => o.channel === 'wholesale');
  const wholesaleCustomers = dbState.customers.filter((c) => c.type === 'wholesale_business');

  const totalWholesaleRevenue = wholesaleOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalReceivables = wholesaleCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.addCustomer({
      name: newCustName,
      companyName: newCustCompany,
      type: 'wholesale_business',
      taxId: newCustTaxId,
      resaleCertVerified: true,
      email: newCustEmail,
      phone: newCustPhone,
      creditLimit: newCustCredit,
      paymentTerms: newCustTerms,
      discountTier: 'Verified B2B Wholesale'
    });
    setShowNewCustModal(false);
    setNewCustName('');
    setNewCustCompany('');
    setNewCustTaxId('');
    setNewCustEmail('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Wholesale & B2B Operations</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Commercial accounts, tiered price break schedules, Net-30 invoicing, and bulk dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCustModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>New B2B Account</span>
          </button>
          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-blue-500 hover:bg-blue-400 rounded shadow-sm transition-colors"
          >
            <span>Create Wholesale Order</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">B2B Commercial Revenue</p>
          <p className="text-2xl font-bold font-mono text-blue-400 tabular-nums mt-1">
            ${totalWholesaleRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {wholesaleOrders.length} B2B Contracts & Invoices
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Outstanding Receivables (A/R)</p>
          <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">
            ${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Pending Net 15/30 settlement
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Verified Resale Entities</p>
          <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
            {wholesaleCustomers.length} Active Accounts
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tax-Exempt Certificates Verified</span>
          </p>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-md w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Wholesale Invoices ({wholesaleOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'customers'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Client Accounts ({wholesaleCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'tiers'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Volume Price Tiers ({dbState.priceTiers.length})</span>
        </button>
      </div>

      {/* VIEW 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">B2B Company / Buyer</th>
                  <th className="py-3 px-4">Tax ID / Cert</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {wholesaleOrders.map((order) => {
                  const isPaid = order.paymentStatus === 'paid';
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200">{order.customerCompany || order.customerName}</p>
                        <p className="text-[11px] text-slate-400">Attn: {order.customerName}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                        {order.customerTaxId || 'Exempt Verified'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-300">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} units
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                        ${order.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 uppercase">
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Net 30 Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Client Accounts Directory */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Tax ID / Resale License</th>
                  <th className="py-3 px-4">Credit Terms</th>
                  <th className="py-3 px-4 text-right">Credit Line</th>
                  <th className="py-3 px-4 text-right">Outstanding (A/R)</th>
                  <th className="py-3 px-4 text-right">Available Credit</th>
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {wholesaleCustomers.map((cust) => {
                  const available = cust.creditLimit - cust.outstandingBalance;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {cust.companyName}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{cust.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                        {cust.taxId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono uppercase text-slate-300">
                        {cust.paymentTerms}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        ${cust.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-amber-400">
                        ${cust.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                        ${available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <p>{cust.email}</p>
                        <p className="text-[11px] text-slate-400">{cust.phone}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Price Tiers Matrix */}
      {activeTab === 'tiers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <span className="text-xs font-semibold text-slate-200">
              Contract Volume Price Breaks · Automatically evaluated during POS & Wholesale checkout
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Tier Label</th>
                  <th className="py-3 px-4 text-center">Minimum Units (MOQ)</th>
                  <th className="py-3 px-4 text-right">Standard MSRP</th>
                  <th className="py-3 px-4 text-right font-bold text-white">Tier Unit Price</th>
                  <th className="py-3 px-4 text-right text-emerald-400 font-bold">Discount %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {dbState.priceTiers.map((tier) => {
                  const product = dbState.products.find((p) => p.id === tier.productId);
                  return (
                    <tr key={tier.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{product?.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{product?.sku}</td>
                      <td className="py-3 px-4 text-slate-300">{tier.tierLabel}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-100 font-bold">
                        {tier.minQuantity}+
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400 line-through">
                        ${product ? product.retailPrice.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-400 text-sm">
                        ${tier.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                        {tier.discountPercent.toFixed(1)}% OFF
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Wholesale Customer */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-2xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Register Wholesale B2B Account
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Company Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Pacific Artisan Beverages LLC"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Authorized Purchasing Officer:</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Gonzalez"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Tax ID / EIN #:</label>
                  <input
                    type="text"
                    placeholder="US-EIN-XXXXXXXX"
                    value={newCustTaxId}
                    onChange={(e) => setNewCustTaxId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Payment Terms:</label>
                  <select
                    value={newCustTerms}
                    onChange={(e) => setNewCustTerms(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="net15">Net 15 Days</option>
                    <option value="net30">Net 30 Days</option>
                    <option value="net60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Approved Credit Line ($):</label>
                <input
                  type="number"
                  value={newCustCredit}
                  onChange={(e) => setNewCustCredit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Email:</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Phone:</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-blue-400 hover:bg-blue-300 rounded"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrder && (
        <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
