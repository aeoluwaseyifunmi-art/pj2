import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { RegisterShift, Order } from '../../types/database';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  RotateCcw
} from 'lucide-react';
import { exportToCsv, exportToExcel, printAuditStatement } from '../../utils/exportUtils';
import { RefundModal } from '../pos/RefundModal';

interface PosReportingProps {
  dbState: DatabaseState;
}

export const PosReporting: React.FC<PosReportingProps> = ({ dbState }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | 'all'>('all');
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'shifts' | 'velocity'>('overview');

  // Close shift modal
  const [closingShift, setClosingShift] = useState<RegisterShift | null>(null);
  const [actualCashCount, setActualCashCount] = useState<number>(0);
  const [orderForRefund, setOrderForRefund] = useState<Order | null>(null);

  // Financial calculations
  const analytics = useMemo(() => {
    const orders = dbState.orders;

    let grossSales = 0;
    let netSales = 0;
    let discountsTotal = 0;
    let taxCollected = 0;
    let cogsTotal = 0;

    let retailGross = 0;
    let retailOrdersCount = 0;
    let wholesaleGross = 0;
    let wholesaleOrdersCount = 0;

    const hourlyMap: Record<number, { hour: number; sales: number; count: number }> = {};
    for (let h = 8; h <= 20; h++) {
      hourlyMap[h] = { hour: h, sales: 0, count: 0 };
    }

    const productSalesMap: Record<
      string,
      {
        id: string;
        name: string;
        sku: string;
        category: string;
        units: number;
        revenue: number;
        cogs: number;
        margin: number;
      }
    > = {};

    orders.forEach((o) => {
      grossSales += o.grandTotal;
      netSales += o.subtotal;
      discountsTotal += o.discountTotal;
      taxCollected += o.taxTotal;
      cogsTotal += o.costTotal;

      if (o.channel === 'retail') {
        retailGross += o.grandTotal;
        retailOrdersCount++;
      } else {
        wholesaleGross += o.grandTotal;
        wholesaleOrdersCount++;
      }

      const orderDate = new Date(o.createdAt);
      const hour = orderDate.getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].sales += o.grandTotal;
        hourlyMap[hour].count++;
      }

      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            id: item.productId,
            name: item.name,
            sku: item.sku,
            category: '',
            units: 0,
            revenue: 0,
            cogs: 0,
            margin: 0
          };
        }
        productSalesMap[item.productId].units += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
        productSalesMap[item.productId].cogs += item.totalCost;
      });
    });

    const grossProfit = netSales - cogsTotal;
    const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const aov = orders.length > 0 ? grossSales / orders.length : 0;
    const retailAov = retailOrdersCount > 0 ? retailGross / retailOrdersCount : 0;
    const wholesaleAov = wholesaleOrdersCount > 0 ? wholesaleGross / wholesaleOrdersCount : 0;

    // Fill categories into products
    Object.values(productSalesMap).forEach((p) => {
      const orig = dbState.products.find((prod) => prod.id === p.id);
      if (orig) p.category = orig.category;
      p.margin = p.revenue - p.cogs;
    });

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

    return {
      grossSales,
      netSales,
      discountsTotal,
      taxCollected,
      cogsTotal,
      grossProfit,
      grossMarginPercent,
      ordersCount: orders.length,
      aov,
      retailGross,
      retailOrdersCount,
      retailAov,
      wholesaleGross,
      wholesaleOrdersCount,
      wholesaleAov,
      hourlyData: Object.values(hourlyMap),
      topProducts
    };
  }, [dbState.orders, dbState.products]);

  // Export Sales Ledger CSV
  const handleExportSalesCsv = () => {
    const headers = [
      'Order Number',
      'Date Time',
      'Channel',
      'Facility Location',
      'Customer Name',
      'Customer Company',
      'Payment Method',
      'Subtotal',
      'Discount Total',
      'Tax Total',
      'Grand Total',
      'COGS',
      'Gross Profit'
    ];

    const rows = dbState.orders.map((o) => {
      const profit = o.subtotal - o.costTotal;
      return [
        o.orderNumber,
        o.createdAt,
        o.channel,
        `"${o.locationName.replace(/"/g, '""')}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${(o.customerCompany || '').replace(/"/g, '""')}"`,
        o.paymentMethod,
        o.subtotal.toFixed(2),
        o.discountTotal.toFixed(2),
        o.taxTotal.toFixed(2),
        o.grandTotal.toFixed(2),
        o.costTotal.toFixed(2),
        profit.toFixed(2)
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pos_sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExecuteCloseShift = () => {
    if (!closingShift) return;
    dbStore.closeShift(closingShift.id, actualCashCount);
    setClosingShift(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Point-of-Sale Reporting & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade financial reporting, retail vs wholesale channel margins, shift Z-reports, and velocity analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSalesCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              const exportRows = dbState.orders.map((o) => ({
                OrderNumber: o.orderNumber,
                Date: o.createdAt,
                Channel: o.channel,
                Location: o.locationName,
                Customer: o.customerName,
                Company: o.customerCompany || '',
                PaymentMethod: o.paymentMethod,
                Subtotal: o.subtotal,
                Tax: o.taxTotal,
                GrandTotal: o.grandTotal,
                Cost: o.costTotal,
                GrossProfit: o.subtotal - o.costTotal
              }));
              exportToExcel(`pos_sales_ledger_${new Date().toISOString().slice(0, 10)}`, 'Sales Ledger', exportRows);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={() => {
              printAuditStatement({
                title: 'OmniStock POS & Sales Audit Statement',
                subtitle: `Executive Financial Statement • ${new Date().toLocaleDateString()}`,
                metrics: [
                  { label: 'Gross Revenue', value: `$${analytics.grossSales.toFixed(2)}` },
                  { label: 'COGS', value: `$${analytics.cogsTotal.toFixed(2)}` },
                  { label: 'Gross Profit', value: `$${analytics.grossProfit.toFixed(2)}` },
                  { label: 'Gross Margin', value: `${analytics.grossMarginPercent.toFixed(1)}%` },
                ],
                tableHeaders: ['Order #', 'Date', 'Channel', 'Customer', 'Method', 'Total', 'Profit'],
                tableRows: dbState.orders.slice(0, 30).map((o) => [
                  o.orderNumber,
                  new Date(o.createdAt).toLocaleDateString(),
                  o.channel.toUpperCase(),
                  o.customerName,
                  o.paymentMethod,
                  `$${o.grandTotal.toFixed(2)}`,
                  `$${(o.subtotal - o.costTotal).toFixed(2)}`
                ]),
                footerNotes: 'Certified OmniStock POS Audit Record • Compliant with internal fiscal controls'
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Audit PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Gross Revenue</p>
          <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
            ${analytics.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {analytics.ordersCount} Total Orders
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Cost of Goods Sold (COGS)</p>
          <p className="text-2xl font-bold font-mono text-slate-300 tabular-nums mt-1">
            ${analytics.cogsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Direct Material Cost
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Gross Profit & Margin</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            ${analytics.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono font-semibold">
            {analytics.grossMarginPercent.toFixed(1)}% Gross Margin
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 font-medium">Volume Savings / Discounts</p>
          <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">
            ${analytics.discountsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Tier Breaks & VIP Perks
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400 font-medium">Average Order Value (AOV)</p>
          <p className="text-2xl font-bold font-mono text-blue-400 tabular-nums mt-1">
            ${analytics.aov.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Blended Across Channels
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-md w-fit">
        <button
          onClick={() => setActiveReportTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeReportTab === 'overview'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Channel Comparison & Rush Hours</span>
        </button>

        <button
          onClick={() => setActiveReportTab('velocity')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeReportTab === 'velocity'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Product Velocity & Profitability</span>
        </button>

        <button
          onClick={() => setActiveReportTab('shifts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeReportTab === 'shifts'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Cashier Shifts & Z-Report ({dbState.shifts.length})</span>
        </button>
      </div>

      {/* VIEW 1: Channel Comparison & Rush Hours */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* Dual Channel Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retail Walk-in */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Retail Storefronts</h3>
                  <p className="text-xs text-slate-400">Flagship & Northside Outlets</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {analytics.retailOrdersCount} Orders
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="text-slate-400">Total Retail Sales</p>
                  <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                    ${analytics.retailGross.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="text-slate-400">Average Basket Size</p>
                  <p className="text-lg font-bold font-mono text-slate-100 tabular-nums mt-0.5">
                    ${analytics.retailAov.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                High customer frequency with instantaneous card and cash settlements. Tax-assessed at local retail rates.
              </p>
            </div>

            {/* Wholesale B2B */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Wholesale & B2B Distribution</h3>
                  <p className="text-xs text-slate-400">Central Distribution Center Fulfillment</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-blue-950 text-blue-400 border border-blue-800">
                  {analytics.wholesaleOrdersCount} Contracts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="text-slate-400">Total Wholesale Sales</p>
                  <p className="text-lg font-bold font-mono text-blue-400 tabular-nums mt-0.5">
                    ${analytics.wholesaleGross.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="text-slate-400">Average Contract Value</p>
                  <p className="text-lg font-bold font-mono text-slate-100 tabular-nums mt-0.5">
                    ${analytics.wholesaleAov.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Bulk case pallet deliveries with tiered volume breaks, Net 15/30 terms, and tax-exempt certificates on file.
              </p>
            </div>
          </div>

          {/* Hourly Register Rush Hours Chart */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Hourly Sales Volume</h3>
                <p className="text-xs text-slate-400">Distribution of store transactions throughout the operating day</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Operating hours 8:00 AM - 8:00 PM</span>
            </div>

            <div className="pt-4 grid grid-cols-13 gap-1.5 items-end h-40">
              {analytics.hourlyData.map((h) => {
                const maxHour = Math.max(...analytics.hourlyData.map((d) => d.sales), 100);
                const barHeight = Math.max(10, Math.round((h.sales / maxHour) * 100));

                return (
                  <div key={h.hour} className="flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                      ${Math.round(h.sales)}
                    </div>
                    <div
                      className="w-full bg-slate-800 group-hover:bg-emerald-500 rounded-t transition-all"
                      style={{ height: `${barHeight}%` }}
                    />
                    <div className="text-[10px] font-mono text-slate-400 mt-2">
                      {h.hour > 12 ? `${h.hour - 12}p` : `${h.hour}a`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Product Velocity & Margin */}
      {activeReportTab === 'velocity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Product SKU Velocity & Gross Margin Contribution
            </span>
            <span className="text-xs text-slate-400 font-mono">Ranked by revenue generation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Cost (COGS)</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">Gross Margin ($)</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {analytics.topProducts.map((p) => {
                  const marginPct = p.revenue > 0 ? (p.margin / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">{p.sku}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{p.name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white tabular-nums">
                        {p.units}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-100 font-bold">
                        ${p.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                        ${p.cogs.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-400">
                        ${p.margin.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200 font-medium">
                        {marginPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Cashier Shift Reconciliation (Z-Report) */}
      {activeReportTab === 'shifts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Cash Drawer Sessions & End-of-Day Z-Reports</h3>
              <p className="text-xs text-slate-400">Track opening float, collected cash, card totals, and drawer variance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbState.shifts.map((shift) => {
              const loc = dbState.locations.find((l) => l.id === shift.locationId);
              const isOpen = shift.status === 'open';

              return (
                <div
                  key={shift.id}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-200">{shift.registerId}</p>
                      <p className="text-[11px] text-slate-400">{loc?.name}</p>
                    </div>
                    {isOpen ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>Shift Open</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Shift Closed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <p className="text-slate-400">Cashier on Duty:</p>
                      <p className="text-slate-200 font-medium">{shift.cashier}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Opened At:</p>
                      <p className="text-slate-300">
                        {new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Opening Cash Float:</span>
                      <span className="tabular-nums text-slate-200">${shift.openingFloat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cash Sales Collected:</span>
                      <span className="tabular-nums text-emerald-400">+${shift.cashCollected.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Card Batch Settlement:</span>
                      <span className="tabular-nums text-blue-400">${shift.cardCollected.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-200 font-bold">
                      <span>Expected Drawer Cash:</span>
                      <span className="tabular-nums">${shift.expectedCash.toFixed(2)}</span>
                    </div>

                    {!isOpen && shift.actualCashCount !== undefined && (
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Counted Cash:</span>
                        <span className="tabular-nums text-slate-100">${shift.actualCashCount.toFixed(2)}</span>
                      </div>
                    )}
                    {!isOpen && shift.cashVariance !== undefined && (
                      <div className="flex justify-between font-bold">
                        <span>Variance (Over/Short):</span>
                        <span
                          className={`tabular-nums ${
                            shift.cashVariance === 0
                              ? 'text-emerald-400'
                              : shift.cashVariance > 0
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {shift.cashVariance > 0 ? `+${shift.cashVariance.toFixed(2)}` : shift.cashVariance.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <button
                      onClick={() => {
                        setClosingShift(shift);
                        setActualCashCount(shift.expectedCash);
                      }}
                      className="w-full py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
                    >
                      Close Shift & Count Drawer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Close Shift */}
      {closingShift && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-5 space-y-4 text-slate-200 shadow-2xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Close Register Shift · {closingShift.registerId}
            </h3>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400 font-mono">
                <span>Expected Drawer Total:</span>
                <span className="text-slate-200 font-bold">${closingShift.expectedCash.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-medium">Actual Physical Cash Counted ($):</label>
              <input
                type="number"
                step="0.01"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-base"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Calculated Variance:</span>
                <span
                  className={`font-bold ${
                    actualCashCount - closingShift.expectedCash === 0
                      ? 'text-emerald-400'
                      : actualCashCount - closingShift.expectedCash > 0
                      ? 'text-blue-400'
                      : 'text-rose-400'
                  }`}
                >
                  ${(actualCashCount - closingShift.expectedCash).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setClosingShift(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCloseShift}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded"
              >
                Confirm & Reconcile Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {orderForRefund && (
        <RefundModal
          order={orderForRefund}
          onClose={() => setOrderForRefund(null)}
        />
      )}
    </div>
  );
};
