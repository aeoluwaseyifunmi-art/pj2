import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Inputer, Product, Customer, Order, Location, PaymentMethod } from '../../types/database';
import { dbStore } from '../../db/databaseStore';
import { ReceiptModal } from '../pos/ReceiptModal';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Printer,
  Search,
  Plus,
  Minus,
  Trash2,
  Lock,
  LogOut,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  History,
  KeyRound,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  Layers,
  Landmark
} from 'lucide-react';

interface DedicatedInputerTerminalProps {
  initialStaffCode?: string;
  onExitToAdmin?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export const DedicatedInputerTerminal: React.FC<DedicatedInputerTerminalProps> = ({
  initialStaffCode,
  onExitToAdmin
}) => {
  // Inputer Authentication state
  const [currentInputer, setCurrentInputer] = useState<Inputer | null>(null);
  const [inputerStaffCode, setInputerStaffCode] = useState(initialStaffCode || 'INP-01');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Terminal Catalog & Sales state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_walkin_retail');
  const [channel, setChannel] = useState<'retail' | 'wholesale'>('retail');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  // Active Receipt Modal
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const state = dbStore.getState();
    setProducts([...state.products]);
    setCustomers([...state.customers]);
    setLocations([...state.locations]);

    // If an inputer is authenticated, reload their latest record and orders
    if (currentInputer) {
      const refreshed = dbStore.getInputerById(currentInputer.id);
      if (refreshed) {
        setCurrentInputer(refreshed);
      }
      const myOrders = state.orders.filter(
        (o) => o.inputerId === currentInputer.id || o.cashier.includes(currentInputer.name)
      );
      setRecentOrders(myOrders);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentInputer?.id]);

  // Attempt auto-login if initialStaffCode passed and already in session
  useEffect(() => {
    if (initialStaffCode) {
      setInputerStaffCode(initialStaffCode);
      const sessionStaff = sessionStorage.getItem(`omnistock_inputer_${initialStaffCode}`);
      if (sessionStaff) {
        try {
          const parsed = JSON.parse(sessionStaff);
          const verified = dbStore.getInputerById(parsed.id);
          if (verified && verified.status === 'active') {
            setCurrentInputer(verified);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [initialStaffCode]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const res = dbStore.authenticateInputer(inputerStaffCode, pinInput);
    if (res.success && res.inputer) {
      setCurrentInputer(res.inputer);
      sessionStorage.setItem(`omnistock_inputer_${res.inputer.staffCode}`, JSON.stringify(res.inputer));
      setPinInput('');
      // focus search input
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
    } else {
      setAuthError(res.message);
    }
  };

  const handleLogout = () => {
    if (currentInputer) {
      sessionStorage.removeItem(`omnistock_inputer_${currentInputer.staffCode}`);
    }
    setCurrentInputer(null);
    setCart([]);
    setPinInput('');
  };

  const activeLocation = useMemo(() => {
    if (!currentInputer) return locations[0];
    return locations.find((l) => l.id === currentInputer.assignedLocationId) || locations[0];
  }, [currentInputer, locations]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.barcode.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to Cart
  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const newQty = existing ? existing.quantity + 1 : 1;

    // Check stock
    const locId = activeLocation ? activeLocation.id : undefined;
    const available = dbStore.getProductStock(product.id, locId);
    if (newQty > available) {
      setNotification(`Warning: Stock for ${product.name} at ${activeLocation?.name || 'store'} is only ${available}.`);
      setTimeout(() => setNotification(null), 3500);
    }

    const priceInfo = dbStore.calculateProductPrice(product.id, newQty, channel === 'wholesale');

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, unitPrice: priceInfo.unitPrice, discountPercent: priceInfo.discountPercent }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: priceInfo.unitPrice,
          discountPercent: priceInfo.discountPercent
        }
      ]);
    }
  };

  // Adjust Cart Quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            const priceInfo = dbStore.calculateProductPrice(item.product.id, nextQty, channel === 'wholesale');
            return {
              ...item,
              quantity: nextQty,
              unitPrice: priceInfo.unitPrice,
              discountPercent: priceInfo.discountPercent
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Barcode / SKU scan submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === searchQuery.trim().toLowerCase() ||
        p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setSearchQuery('');
      setNotification(`Added "${matched.name}" via scan!`);
      setTimeout(() => setNotification(null), 2000);
    }
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.product.retailPrice, 0);
  const cartGrandTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cartDiscount = cartSubtotal - cartGrandTotal;
  const taxAmount = channel === 'retail' ? cartGrandTotal * 0.075 : 0; // 7.5% retail tax
  const finalPayable = cartGrandTotal + taxAmount;

  const numericCashTendered = parseFloat(cashTendered) || 0;
  const cashChange = numericCashTendered > finalPayable ? numericCashTendered - finalPayable : 0;

  // Process and Print Receipt
  const handleCompleteOrder = () => {
    if (!currentInputer) return;
    if (cart.length === 0) {
      alert('Cart is empty. Add items to print a receipt.');
      return;
    }

    const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    const orderPayload = {
      channel,
      status: 'completed' as const,
      locationId: activeLocation.id,
      locationName: activeLocation.name,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerCompany: currentCustomer.companyName,
      customerTaxId: currentCustomer.taxId,
      items: cart.map((item) => ({
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        unitCost: item.product.costPrice,
        unitPrice: item.unitPrice,
        originalPrice: channel === 'wholesale' ? item.product.wholesaleBasePrice : item.product.retailPrice,
        subtotal: item.quantity * item.unitPrice,
        totalCost: item.quantity * item.product.costPrice
      })),
      subtotal: cartSubtotal,
      discountTotal: cartDiscount,
      taxTotal: taxAmount,
      grandTotal: finalPayable,
      costTotal: cart.reduce((sum, i) => sum + i.quantity * i.product.costPrice, 0),
      paymentMethod,
      paymentStatus: (channel === 'wholesale' && paymentMethod === 'net_terms_invoice'
        ? 'pending_net30'
        : 'paid') as any,
      cashTendered: paymentMethod === 'cash' ? numericCashTendered : undefined,
      cashChange: paymentMethod === 'cash' ? cashChange : undefined,
      cashier: `${currentInputer.name} (${currentInputer.staffCode})`,
      inputerId: currentInputer.staffCode,
      inputerName: currentInputer.name,
      receiptPrinted: autoPrintReceipt,
      notes: `Inputer POS Terminal entry at ${activeLocation.name}`
    };

    const createdOrder = dbStore.processOrder(orderPayload);

    // Auto open receipt modal & trigger print
    setActiveReceiptOrder(createdOrder);

    // Reset Cart
    setCart([]);
    setCashTendered('');
    setNotification(`Order ${createdOrder.orderNumber} completed & receipt registered!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // If NOT Logged In: Show Clean POS Lockscreen
  if (!currentInputer) {
    const allInputers = dbStore.getInputers();

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle variant="terminal" showLabel={true} />
        </div>
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-xl mx-auto flex items-center justify-center shadow-inner">
              <Printer className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Inputer POS Web Terminal</h1>
            <p className="text-xs text-slate-400">
              High-Speed Cashier Data Entry & Receipt Printing Station
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-md">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Staff Inputer / Code
              </label>
              <select
                value={inputerStaffCode}
                onChange={(e) => setInputerStaffCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {allInputers.map((inp) => (
                  <option key={inp.id} value={inp.staffCode}>
                    {inp.staffCode} — {inp.name} ({inp.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                4-Digit Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2.5 text-base font-mono tracking-widest text-amber-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Default PINs: Alexander (1234), Jordan (2468), Chloe (9876)</p>
            </div>

            {/* Quick PIN Numpad buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, '←'].map((key) => (
                <button
                  type="button"
                  key={key.toString()}
                  onClick={() => {
                    if (key === 'Clear') setPinInput('');
                    else if (key === '←') setPinInput((p) => p.slice(0, -1));
                    else if (pinInput.length < 6) setPinInput((p) => p + key.toString());
                  }}
                  className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-mono font-medium text-slate-200 rounded transition-colors cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Unlock Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Terminal Mode: Direct Web URL</span>
            {onExitToAdmin && (
              <button
                onClick={onExitToAdmin}
                className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Back to Admin ERP
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN: Dedicated POS & Receipt Printing Terminal
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Terminal Top Nav */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-950 border border-cyan-800 rounded flex items-center justify-center text-cyan-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">INPUTER WEB TERMINAL</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
                {currentInputer.staffCode}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-slate-300 font-medium">{currentInputer.name}</span>
              <span>·</span>
              <span className="text-slate-400">{activeLocation.name}</span>
            </div>
          </div>
        </div>

        {/* Shift KPIs for current Inputer */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Printed:</span>
            <span className="text-white font-bold">{currentInputer.receiptsPrintedCount}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Volume:</span>
            <span className="text-emerald-400 font-bold">
              ${currentInputer.totalSalesVolume.toFixed(2)}
            </span>
          </div>

          {/* Action buttons */}
          <ThemeToggle variant="terminal" showLabel={true} />

          <button
            onClick={handleLogout}
            title="Lock terminal / Switch cashier"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-xs transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Station</span>
          </button>

          {onExitToAdmin && (
            <button
              onClick={onExitToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-700 rounded font-sans text-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Admin ERP</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="bg-cyan-950/90 border-b border-cyan-800 text-cyan-200 text-xs px-4 py-2 font-mono flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-cyan-400 font-bold">✕</button>
        </div>
      )}

      {/* Main Terminal Workspace: 2-Column Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left 7 Columns: Product Catalog, Quick Search, Categories */}
        <div className="lg:col-span-7 flex flex-col border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          {/* Quick Barcode / SKU Scan Header */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products you sell by name or category..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Add Item
            </button>
          </form>

          {/* Category Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const stock = dbStore.getProductStock(prod.id, activeLocation.id);
              const isOutOfStock = stock <= 0;
              const price = channel === 'wholesale' ? prod.wholesaleBasePrice : prod.retailPrice;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && handleAddToCart(prod)}
                  className={`bg-slate-900 border rounded-lg p-3 flex flex-col justify-between transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'border-slate-800/40 opacity-50 cursor-not-allowed'
                      : 'border-slate-800 hover:border-cyan-500/80 hover:bg-slate-800/40 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {prod.imageUrl && (
                      <div className="w-full aspect-video rounded bg-slate-950 mb-2 overflow-hidden border border-slate-800/80 flex items-center justify-center">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>{prod.sku}</span>
                      <span
                        className={`tabular-nums font-semibold ${
                          stock <= 5 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {stock} in stock
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                      ${price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="p-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Feed: Recent Receipts by this Inputer for Fast Reprinting */}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Recent Receipts by {currentInputer.name} (One-Click Reprint)
              </span>
              <span className="text-xs text-slate-400">{recentOrders.length} orders logged</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No orders processed yet today. Complete a sale to print the first receipt.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <tbody className="divide-y divide-slate-800/60">
                    {recentOrders.slice(0, 8).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-cyan-400 font-bold">{ord.orderNumber}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{ord.customerName}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                          ${ord.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 text-xs">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setActiveReceiptOrder(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Reprint Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Active POS Cart, Customer, Payment Tender & Direct Receipt Trigger */}
        <div className="lg:col-span-5 bg-slate-900/60 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Channel & Customer Selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Channel:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setChannel('retail')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    channel === 'retail' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Retail POS
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('wholesale')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    channel === 'wholesale' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wholesale
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Account:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg flex-1 flex flex-col min-h-64 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-600" />
                  <p>Cart is currently empty.</p>
                  <p className="text-slate-400">Scan barcodes or tap products on the left catalog to add.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-2 px-1 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-white truncate">{item.product.name}</div>
                      <div className="text-xs font-mono text-slate-400">
                        ${item.unitPrice.toFixed(2)} each
                        {item.discountPercent > 0 && (
                          <span className="text-emerald-400 ml-1">(-{item.discountPercent.toFixed(0)}%)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-white w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="font-mono text-xs font-bold text-cyan-400 w-16 text-right tabular-nums">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Calculations Summary */}
            <div className="bg-slate-950 p-3 border-t border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="tabular-nums">${cartSubtotal.toFixed(2)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Volume Tier Discount:</span>
                  <span className="tabular-nums">-${cartDiscount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Sales Tax (7.5%):</span>
                  <span className="tabular-nums">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-slate-800">
                <span className="font-sans">Grand Total:</span>
                <span className="text-cyan-400 tabular-nums">${finalPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method & Cash Tender */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Payment Method:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`py-2 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'credit_card'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-2 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Bank Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('net_terms_invoice')}
                className={`py-2 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'net_terms_invoice'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Net 30</span>
              </button>
            </div>

            {/* If Bank Transfer: Display instant settlement notice */}
            {paymentMethod === 'bank_transfer' && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs flex items-center justify-between text-amber-300 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Settlement Bank Auto-Verification Active</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">DONE ON TENDER</span>
              </div>
            )}

            {/* If Cash: Quick denominations and Change calculator */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cash Tendered ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={finalPayable.toFixed(2)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 justify-end">
                  {[20, 50, 100].map((bill) => (
                    <button
                      type="button"
                      key={bill}
                      onClick={() => setCashTendered(bill.toString())}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded cursor-pointer"
                    >
                      ${bill}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(finalPayable.toFixed(2))}
                    className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono rounded border border-cyan-800 cursor-pointer"
                  >
                    Exact
                  </button>
                </div>

                {numericCashTendered >= finalPayable && finalPayable > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 font-mono">
                    <span className="text-slate-400">Change Due to Customer:</span>
                    <span className="text-amber-400 font-bold">${cashChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Auto Print Receipt Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-800 focus:ring-0"
              />
              <span className="font-medium text-white flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                Instantly Launch Thermal Receipt Print Modal
              </span>
            </label>
          </div>

          {/* Submit Action: Complete Sale & Print Receipt */}
          <button
            onClick={handleCompleteOrder}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              cart.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-cyan-950/50'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>COMPLETE SALE & PRINT RECEIPT (${finalPayable.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Embedded Full Receipt Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
          onReceiptPrinted={(ord) => {
            setNotification(`Receipt printed for ${ord.orderNumber}! Counter updated.`);
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}
    </div>
  );
};
