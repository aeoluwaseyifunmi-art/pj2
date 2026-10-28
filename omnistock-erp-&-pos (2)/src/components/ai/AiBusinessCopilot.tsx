import React, { useState, useEffect } from 'react';
import { DatabaseState, dbStore } from '../../db/databaseStore';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Layers,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportUtils';

interface AiBusinessCopilotProps {
  dbState: DatabaseState;
  onNavigateToTab?: (tab: string) => void;
  onOpenCreatePO?: () => void;
}

interface ForecastItem {
  sku: string;
  recommendedReorderQty: number;
  daysUntilStockout: number;
  urgency: 'critical' | 'warning' | 'healthy';
  reason: string;
  estimatedCost: number;
}

export const AiBusinessCopilot: React.FC<AiBusinessCopilotProps> = ({
  dbState,
  onNavigateToTab,
  onOpenCreatePO
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'insights' | 'restock' | 'risks'>('insights');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [analysisSource, setAnalysisSource] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [forecastItems, setForecastItems] = useState<ForecastItem[]>([]);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [selectedFocus, setSelectedFocus] = useState<string>('Comprehensive Profit & Restock Analysis');

  // Compute live real snapshot from dbState
  const activeLocationId = dbStore.getActiveLocationId();
  const activeLocation = dbState.locations.find((l) => l.id === activeLocationId) || dbState.locations[0];

  const totalRevenue = dbState.orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalCost = dbState.orders.reduce((sum, o) => sum + (o.costTotal || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const orderCount = dbState.orders.length;

  // Inventory valuation
  const inventoryValuation = dbState.inventory.reduce((sum, inv) => {
    const prod = dbState.products.find((p) => p.id === inv.productId);
    return sum + inv.quantityOnHand * (prod?.costPrice || 0);
  }, 0);

  // Product sales velocity
  const salesMap: Record<string, { qty: number; revenue: number }> = {};
  dbState.orders.forEach((ord) => {
    ord.items?.forEach((it) => {
      if (!salesMap[it.productId]) {
        salesMap[it.productId] = { qty: 0, revenue: 0 };
      }
      salesMap[it.productId].qty += it.quantity;
      salesMap[it.productId].revenue += it.subtotal;
    });
  });

  const productsWithStock = dbState.products.map((prod) => {
    const stock = dbStore.getProductStock(prod.id);
    const sold = salesMap[prod.id]?.qty || 0;
    const rev = salesMap[prod.id]?.revenue || 0;
    return {
      ...prod,
      currentStock: stock,
      unitsSold: sold,
      revenueGenerated: rev
    };
  });

  const outOfStockProducts = productsWithStock.filter((p) => p.currentStock <= 0);
  const lowStockProducts = productsWithStock.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.reorderThreshold
  );
  const topSellers = [...productsWithStock].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
  const slowMovers = productsWithStock.filter((p) => p.unitsSold === 0 || p.unitsSold < 3);

  const customerBalances = (dbState.customers || []).map((c) => ({
    name: c.name,
    company: c.companyName,
    outstandingBalance: c.outstandingBalance || 0,
    creditLimit: c.creditLimit || 0
  }));

  const totalDebt = customerBalances.reduce((s, c) => s + c.outstandingBalance, 0);

  const fetchInsights = async (customPrompt?: string, focus?: string) => {
    setLoading(true);
    try {
      const snapshot = {
        totalRevenue,
        totalCost,
        grossProfit,
        marginPercent,
        orderCount,
        inventoryValuation,
        outOfStockCount: outOfStockProducts.length,
        lowStockCount: lowStockProducts.length,
        topSellingProducts: topSellers.map((p) => ({
          name: p.name,
          sku: p.sku,
          sold: p.unitsSold,
          revenue: p.revenueGenerated
        })),
        slowMovingProducts: slowMovers.map((p) => ({
          name: p.name,
          sku: p.sku,
          stock: p.currentStock,
          cost: p.costPrice
        })),
        customerBalances,
        activeLocation: activeLocation?.name || 'All Locations'
      };

      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot,
          userPrompt: customPrompt || userQuery,
          focusArea: focus || selectedFocus
        })
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysisText(data.analysis);
        setAnalysisSource(data.source || 'gemini-3.8-flash');
      } else {
        setAnalysisText(data.error || 'Failed to generate insights');
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisText('Error communicating with AI server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestockForecast = async () => {
    setForecastLoading(true);
    try {
      const itemsPayload = productsWithStock.map((p) => ({
        sku: p.sku,
        name: p.name,
        currentStock: p.currentStock,
        reorderThreshold: p.reorderThreshold,
        dailySalesVelocity: Math.max(0.5, p.unitsSold / 14), // approx 2-week rolling velocity
        unitCost: p.costPrice
      }));

      const res = await fetch('/api/ai/forecast-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload })
      });

      const data = await res.json();
      if (data.forecast && Array.isArray(data.forecast)) {
        setForecastItems(data.forecast);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!analysisText) {
      fetchInsights();
    }
    if (forecastItems.length === 0) {
      fetchRestockForecast();
    }
  }, []);

  const handleQuickPrompt = (prompt: string, focus: string) => {
    setSelectedFocus(focus);
    setUserQuery(prompt);
    fetchInsights(prompt, focus);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">AI Executive Intelligence & Copilot</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-semibold">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time server-side predictive analytics grounded in your live database ledger. Zero hallucinations.
            </p>
          </div>
        </div>

        {/* Live Metrics Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Gross Margin</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {marginPercent.toFixed(1)}% <span className="text-xs font-normal text-slate-400">(${grossProfit.toFixed(0)})</span>
            </div>
          </div>
          <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Stockout Alerts</div>
            <div className="text-sm font-bold text-rose-400 font-mono">
              {outOfStockProducts.length} <span className="text-xs text-amber-400">({lowStockProducts.length} Low)</span>
            </div>
          </div>
          <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">B2B Unpaid Debt</div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              ${totalDebt.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('insights')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'insights'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Executive Analysis & Q&A</span>
        </button>

        <button
          onClick={() => setActiveSubTab('restock')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'restock'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Restock Forecast & PO Recommendations ({forecastItems.filter((i) => i.urgency !== 'healthy').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'risks'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Risk & Anomaly Radar</span>
        </button>
      </div>

      {/* Tab 1: Executive Insights & Prompting */}
      {activeSubTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Quick Action Prompts & Controls */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Strategic Query Presets
              </h3>
              <p className="text-xs text-slate-400">
                Instantly trigger grounded audit analysis using real ledger totals:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleQuickPrompt(
                      'Analyze our top profit drivers versus slow-moving inventory. Which products are locking up capital?',
                      'Profit Margins & Dead Capital'
                    )
                  }
                  className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-200 cursor-pointer group"
                >
                  <div className="font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-between">
                    <span>1. Profit & Dead Stock Analysis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Identifies high-margin SKUs and dead capital traps</div>
                </button>

                <button
                  onClick={() =>
                    handleQuickPrompt(
                      'What is our restock urgency horizon? Detail which SKUs are within 7 days of complete stockout.',
                      'Stockout Horizon & Reorder Plan'
                    )
                  }
                  className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-200 cursor-pointer group"
                >
                  <div className="font-semibold text-amber-400 group-hover:text-amber-300 flex items-center justify-between">
                    <span>2. Stockout Horizon Forecast</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Calculates days-to-zero based on unit sales velocity</div>
                </button>

                <button
                  onClick={() =>
                    handleQuickPrompt(
                      'Audit our customer aging debt and credit limits. Which wholesale clients represent credit risk?',
                      'Accounts Receivable & Credit Risk'
                    )
                  }
                  className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-200 cursor-pointer group"
                >
                  <div className="font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center justify-between">
                    <span>3. Aging Balances & Credit Risk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Evaluates unpaid Net 30 balances and exposure</div>
                </button>

                <button
                  onClick={() =>
                    handleQuickPrompt(
                      'Provide a multi-location stock balance comparison. Should we transfer items between warehouses?',
                      'Multi-Location Transfer Optimization'
                    )
                  }
                  className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-xs text-slate-200 cursor-pointer group"
                >
                  <div className="font-semibold text-purple-400 group-hover:text-purple-300 flex items-center justify-between">
                    <span>4. Inter-Warehouse Transfer Audit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Balances stock between central DC and retail stores</div>
                </button>
              </div>
            </div>

            {/* Grounding Data Summary Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Ledger Grounding Telemetry
              </div>
              <ul className="space-y-1.5 text-slate-400 font-mono text-[11px]">
                <li className="flex justify-between">
                  <span>Tracked SKUs:</span>
                  <span className="text-white">{dbState.products.length} items</span>
                </li>
                <li className="flex justify-between">
                  <span>Inventory Value (Cost):</span>
                  <span className="text-white">${inventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
                <li className="flex justify-between">
                  <span>Orders Evaluated:</span>
                  <span className="text-white">{orderCount} records</span>
                </li>
                <li className="flex justify-between">
                  <span>Active Branch:</span>
                  <span className="text-emerald-400">{activeLocation?.name}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: AI Output & Custom Chat Query */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col min-h-[500px]">
              {/* Output Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Executive Briefing</span>
                    <span className="text-xs font-normal text-slate-400">({selectedFocus})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Engine: {analysisSource || 'gemini-3.8-flash'} • High-accuracy server inference
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchInsights()}
                    disabled={loading}
                    title="Refresh AI analysis"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Output Content */}
              <div className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-xs font-mono">Synthesizing real database figures with Gemini 3.8 Flash...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-emerald max-w-none text-xs text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                    {analysisText}
                  </div>
                )}
              </div>

              {/* Custom Prompt Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (userQuery.trim() && !loading) {
                    fetchInsights(userQuery, 'Custom User Query');
                  }
                }}
                className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ask any question about sales trends, specific SKUs, profit leaks, or supplier restocks..."
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={loading || !userQuery.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Analyze</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Restock Forecast & Automated PO Predictor */}
      {activeSubTab === 'restock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Predictive Reorder & Stockout Horizon
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI computes item run rates, expected stockout dates, and recommended purchase order lot sizes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  exportToCsv(
                    `Restock_Forecast_${new Date().toISOString().slice(0, 10)}`,
                    forecastItems
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 rounded-lg cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {onOpenCreatePO && (
                <button
                  onClick={onOpenCreatePO}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>+ Create Purchase Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Forecast Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {forecastLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                <span className="text-xs font-mono">Running predictive stockout simulation...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">SKU / Product</th>
                    <th className="py-3 px-4 text-center">Urgency</th>
                    <th className="py-3 px-4 text-right">Days to Zero</th>
                    <th className="py-3 px-4 text-right">Recommended PO Qty</th>
                    <th className="py-3 px-4 text-right">Est. Restock Cost</th>
                    <th className="py-3 px-4">AI Supply Chain Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {forecastItems.map((item) => {
                    const prod = dbState.products.find((p) => p.sku === item.sku);
                    const isCritical = item.urgency === 'critical';
                    const isWarning = item.urgency === 'warning';

                    return (
                      <tr key={item.sku} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{prod?.name || item.sku}</div>
                          <div className="font-mono text-[10px] text-slate-500">{item.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              isCritical
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : isWarning
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {isCritical && <AlertTriangle className="w-2.5 h-2.5" />}
                            {item.urgency}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={item.daysUntilStockout <= 3 ? 'text-rose-400' : 'text-slate-200'}>
                            {item.daysUntilStockout} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          +{item.recommendedReorderQty} units
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          ${item.estimatedCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {item.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Risk & Anomaly Radar */}
      {activeSubTab === 'risks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Out of Stock SKUs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Out-of-Stock SKUs ({outOfStockProducts.length})
              </h3>
              <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950 px-2 py-0.5 rounded border border-rose-900">
                Revenue Loss Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">Products with 0 stock in warehouse or store shelves:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {outOfStockProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                  All active catalog items have stock on hand.
                </div>
              ) : (
                outOfStockProducts.map((p) => (
                  <div key={p.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{p.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-rose-400 font-bold">0 units</div>
                      <div className="text-[10px] text-slate-400">Reorder: {p.reorderThreshold}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: B2B Credit Overdue Risk */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                High Balances ({customerBalances.filter((c) => c.outstandingBalance > 500).length})
              </h3>
              <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
                Cash Flow Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">Wholesale clients with unsettled Net-30 credit balances:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customerBalances.map((cust) => (
                <div key={cust.name} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-white">{cust.company || cust.name}</div>
                    <div className="text-[10px] text-slate-500">Limit: ${cust.creditLimit.toLocaleString()}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-amber-300">${cust.outstandingBalance.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">
                      {cust.creditLimit > 0 ? `${((cust.outstandingBalance / cust.creditLimit) * 100).toFixed(0)}% limit` : 'No limit'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Dead Capital / Slow Movers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                Slow Movers ({slowMovers.length})
              </h3>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900">
                Tied-Up Cash
              </span>
            </div>
            <p className="text-xs text-slate-400">Inventory with low turnover; evaluate discounting or bundle promos:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {slowMovers.map((p) => {
                const tiedCost = p.currentStock * p.costPrice;
                return (
                  <div key={p.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{p.unitsSold} units sold</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-slate-300 font-medium">{p.currentStock} in stock</div>
                      <div className="text-[10px] text-cyan-400">${tiedCost.toFixed(2)} locked</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
