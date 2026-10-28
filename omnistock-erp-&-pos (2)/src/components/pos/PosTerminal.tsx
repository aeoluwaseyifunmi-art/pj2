import React, { useState, useMemo, useEffect } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Product, Order, OrderItem, Customer, PaymentMethod, PaymentStatus } from '../../types/database';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  FileCheck,
  Building,
  Package,
  Layers,
  ArrowRight,
  UserCheck,
  Landmark,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface PosTerminalProps {
  dbState: DatabaseState;
  onOpenScanner?: () => void;
  initialProductId?: string | null;
  onClearInitialProduct?: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  dbState,
  onOpenScanner,
  initialProductId,
  onClearInitialProduct
}) => {
  // Mode: retail or wholesale
  const [channel, setChannel] = useState<'retail' | 'wholesale'>('retail');

  // Selected Store/Warehouse location
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    () => dbStore.getActiveLocationId() || (channel === 'retail' ? 'loc_store_flagship' : 'loc_wh_central')
  );

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_walkin_retail');

  // Cart state
  interface CartItem {
    product: Product;
    quantity: number;
    customDiscountPercent: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [selectedInputerCode, setSelectedInputerCode] = useState<string>(
    dbState.inputers?.[0]?.staffCode || 'INP-01'
  );
  const [bankAutoVerifying, setBankAutoVerifying] = useState(false);
  const [bankVerifiedDone, setBankVerifiedDone] = useState(false);
  const [generatedBankRef, setGeneratedBankRef] = useState<string>('');

  const defaultBank = dbState.linkedBankAccounts?.find((b) => b.isDefault) || dbState.linkedBankAccounts?.[0];

  // When channel switches, adjust defaults
  const handleChannelSwitch = (newChannel: 'retail' | 'wholesale') => {
    setChannel(newChannel);
    if (newChannel === 'wholesale') {
      setSelectedLocationId('loc_wh_central');
      // Set to first wholesale customer
      const wsCust = dbState.customers.find((c) => c.type === 'wholesale_business');
      if (wsCust) setSelectedCustomerId(wsCust.id);
    } else {
      setSelectedLocationId('loc_store_flagship');
      setSelectedCustomerId('cust_walkin_retail');
    }
  };

  // Customers filtered by channel
  const availableCustomers = useMemo(() => {
    if (channel === 'wholesale') {
      return dbState.customers.filter((c) => c.type === 'wholesale_business');
    }
    return dbState.customers.filter((c) => c.type !== 'wholesale_business');
  }, [channel, dbState.customers]);

  const currentCustomer: Customer | undefined = dbState.customers.find(
    (c) => c.id === selectedCustomerId
  );

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    dbState.products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
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
      return matchCat && matchQuery;
    });
  }, [dbState.products, selectedCategory, searchQuery]);

  // Cart item management
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const initialQty = channel === 'wholesale' ? product.minWholesaleQty || 5 : 1;
      setCart([...cart, { product, quantity: initialQty, customDiscountPercent: 0 }]);
    }
  };

  useEffect(() => {
    if (initialProductId) {
      const targetProd = dbState.products.find((p) => p.id === initialProductId);
      if (targetProd) {
        addToCart(targetProd);
      }
      if (onClearInitialProduct) {
        onClearInitialProduct();
      }
    }
  }, [initialProductId]);

  const updateCartQty = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const setCartExactQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing calculations for cart
  const computedItems: OrderItem[] = useMemo(() => {
    const isWholesale = channel === 'wholesale';
    const isTaxExempt = isWholesale && currentCustomer?.resaleCertVerified;

    return cart.map((item) => {
      const priceInfo = dbStore.calculateProductPrice(
        item.product.id,
        item.quantity,
        isWholesale,
        item.customDiscountPercent
      );

      const subtotal = Number((priceInfo.unitPrice * item.quantity).toFixed(2));
      const totalCost = Number((item.product.costPrice * item.quantity).toFixed(2));

      return {
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        unitCost: item.product.costPrice,
        unitPrice: priceInfo.unitPrice,
        originalPrice: priceInfo.originalPrice,
        appliedTierName: priceInfo.tierName,
        subtotal,
        totalCost
      };
    });
  }, [cart, channel, currentCustomer]);

  const subtotal = useMemo(() => {
    return Number(computedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  }, [computedItems]);

  const originalTotal = useMemo(() => {
    return Number(
      computedItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0).toFixed(2)
    );
  }, [computedItems]);

  const discountSavings = useMemo(() => {
    return Math.max(0, Number((originalTotal - subtotal).toFixed(2)));
  }, [originalTotal, subtotal]);

  // Tax calculation: exempt if wholesale with verified resale cert
  const taxRate = channel === 'wholesale' && currentCustomer?.resaleCertVerified ? 0 : 0.0825;
  const taxTotal = useMemo(() => {
    return Number((subtotal * taxRate).toFixed(2));
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return Number((subtotal + taxTotal).toFixed(2));
  }, [subtotal, taxTotal]);

  const costTotal = useMemo(() => {
    return Number(computedItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2));
  }, [computedItems]);

  // Checkout execution
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    let paymentStatus: PaymentStatus = 'paid';
    if (channel === 'wholesale' && paymentMethod === 'net_terms_invoice') {
      paymentStatus = 'pending_net30';
    }

    const cashTendered =
      paymentMethod === 'cash' ? parseFloat(cashTenderedInput) || grandTotal : undefined;
    const cashChange =
      cashTendered !== undefined ? Math.max(0, cashTendered - grandTotal) : undefined;

    const loc = dbState.locations.find((l) => l.id === selectedLocationId);

    const activeInputer = dbState.inputers?.find(
      (i) => i.staffCode === selectedInputerCode || i.id === selectedInputerCode
    );

    const order = dbStore.processOrder({
      channel,
      locationId: selectedLocationId,
      locationName: loc ? loc.name : selectedLocationId,
      customerId: currentCustomer ? currentCustomer.id : 'cust_walkin_retail',
      customerName: currentCustomer ? currentCustomer.name : 'Walk-in Retail Customer',
      customerCompany: currentCustomer?.companyName,
      customerTaxId: currentCustomer?.taxId,
      items: computedItems,
      subtotal,
      discountTotal: discountSavings,
      taxTotal,
      grandTotal,
      costTotal,
      paymentMethod,
      paymentStatus,
      cashTendered,
      cashChange,
      cashier: activeInputer
        ? `${activeInputer.name} (${activeInputer.staffCode})`
        : channel === 'wholesale'
        ? 'B2B Sales Representative'
        : 'Terminal Register 1',
      inputerId: activeInputer?.staffCode,
      inputerName: activeInputer?.name,
      receiptPrinted: true,
      notes: orderNotes,
      bankAccountId: paymentMethod === 'bank_transfer' ? defaultBank?.id : undefined,
      bankName: paymentMethod === 'bank_transfer' ? defaultBank?.bankName : undefined,
      bankTransactionRef:
        paymentMethod === 'bank_transfer'
          ? generatedBankRef || `BNK-TX-${Math.floor(10000 + Math.random() * 90000)}`
          : undefined,
      bankVerified: paymentMethod === 'bank_transfer',
      bankVerifiedAt: paymentMethod === 'bank_transfer' ? new Date().toISOString() : undefined
    });

    setCompletedOrder(order);
    setShowCheckoutModal(false);
    clearCart();
    setCashTenderedInput('');
    setOrderNotes('');
    setBankVerifiedDone(false);
    setGeneratedBankRef('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-slate-950">
      {/* LEFT: Product Catalog & Controls */}
      <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
        {/* Top Channel and Location Control Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          {/* Segmented Channel Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => handleChannelSwitch('retail')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                channel === 'retail'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Retail Counter POS
            </button>
            <button
              onClick={() => handleChannelSwitch('wholesale')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                channel === 'wholesale'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wholesale B2B Order Desk
            </button>
          </div>

          {/* Location and Inputer Selectors */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Location:</span>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  dbStore.setActiveLocationId(e.target.value);
                }}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-hidden focus:border-emerald-500"
              >
                {dbState.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">POS Inputer:</span>
              <select
                value={selectedInputerCode}
                onChange={(e) => setSelectedInputerCode(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded focus:outline-hidden focus:border-cyan-400"
              >
                {(dbState.inputers || []).map((inp) => (
                  <option key={inp.id} value={inp.staffCode}>
                    {inp.staffCode} - {inp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search products you sell by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
          {filteredProducts.map((prod) => {
            const stockAtLoc = dbStore.getProductStock(prod.id, selectedLocationId);
            const isLowStock = stockAtLoc <= prod.reorderThreshold && stockAtLoc > 0;
            const isOutOfStock = stockAtLoc <= 0;

            const displayPrice = channel === 'wholesale' ? prod.wholesaleBasePrice : prod.retailPrice;

            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && addToCart(prod)}
                className={`flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-3 cursor-pointer transition-all hover:border-slate-700 hover:shadow-md ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'
                }`}
              >
                {/* Product Image or Fallback */}
                <div className="relative w-full aspect-4/3 bg-slate-800 rounded overflow-hidden mb-2.5 flex items-center justify-center">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none -z-0">
                    <Package className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[10px] text-slate-400 font-mono">{prod.sku}</span>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums bg-slate-950/80 backdrop-blur-xs text-slate-300">
                    {isOutOfStock ? (
                      <span className="text-rose-400 font-medium">Sold Out</span>
                    ) : isLowStock ? (
                      <span className="text-amber-400">{stockAtLoc} low</span>
                    ) : (
                      <span>{stockAtLoc} in stock</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-100 line-clamp-1">{prod.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{prod.sku}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
                        ${displayPrice.toFixed(2)}
                      </p>
                      {channel === 'wholesale' && (
                        <p className="text-[10px] text-slate-400">MOQ: {prod.minWholesaleQty} units</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Transaction Cart & Checkout Register */}
      <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border-l border-slate-800">
        {/* Customer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{channel === 'wholesale' ? 'B2B Wholesale Account' : 'Customer Profile'}</span>
            </div>
            {currentCustomer?.resaleCertVerified && (
              <span className="text-[11px] text-emerald-400 font-mono font-medium">
                Tax-Exempt Reseller
              </span>
            )}
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-hidden focus:border-emerald-500"
          >
            {availableCustomers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name}
              </option>
            ))}
          </select>

          {/* Wholesale account credit terms banner */}
          {channel === 'wholesale' && currentCustomer && (
            <div className="mt-2 text-xs text-slate-400 space-y-0.5 font-mono pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Credit Terms:</span>
                <span className="text-slate-200 uppercase font-semibold">
                  {currentCustomer.paymentTerms}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Available Credit:</span>
                <span className="text-emerald-400 tabular-nums">
                  ${(currentCustomer.creditLimit - currentCustomer.outstandingBalance).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <ShoppingCart className="w-10 h-10 opacity-30" />
              <p className="text-xs">Register cart is empty</p>
              <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
                Click any product on the left or scan a barcode to begin checkout.
              </p>
            </div>
          ) : (
            computedItems.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-950/60 border border-slate-800/80 rounded p-2.5 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>
                    {item.appliedTierName && (
                      <p className="text-[10px] text-emerald-400 font-sans mt-0.5">
                        Tier Applied: {item.appliedTierName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
                    <button
                      onClick={() => updateCartQty(item.productId, -1)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setCartExactQty(item.productId, parseInt(e.target.value, 10) || 1)}
                      className="w-10 text-center text-xs font-mono font-medium text-slate-200 bg-transparent focus:outline-hidden"
                    />
                    <button
                      onClick={() => updateCartQty(item.productId, 1)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Pricing info */}
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                      ${item.subtotal.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      ${item.unitPrice.toFixed(2)} / unit
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="tabular-nums text-slate-200">${subtotal.toFixed(2)}</span>
          </div>

          {discountSavings > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Volume Discount Savings:</span>
              <span className="tabular-nums">-${discountSavings.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>Sales Tax {channel === 'wholesale' && taxRate === 0 ? '(B2B Exempt)' : '(8.25%)'}:</span>
            <span className="tabular-nums text-slate-200">${taxTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>TOTAL:</span>
            <span className="tabular-nums text-emerald-400">${grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition-colors whitespace-nowrap"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCheckoutModal(true)}
              disabled={cart.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 rounded shadow-sm transition-colors"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Payment Dialog */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Payment Tender · {channel === 'wholesale' ? 'B2B Settlement' : 'POS Register'}
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Total Display */}
            <div className="p-3 bg-slate-950 rounded text-center border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Grand Total Due</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                ${grandTotal.toFixed(2)}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Tender:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center gap-2 p-2.5 text-xs rounded border transition-colors ${
                    paymentMethod === 'credit_card'
                      ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Credit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center gap-2 p-2.5 text-xs rounded border transition-colors ${
                    paymentMethod === 'cash'
                      ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Cash Drawer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    if (!generatedBankRef) {
                      setGeneratedBankRef(`BNK-TX-${Math.floor(10000 + Math.random() * 90000)}`);
                    }
                  }}
                  className={`flex items-center gap-2 p-2.5 text-xs rounded border transition-colors ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Bank Transfer (Auto)</span>
                </button>

                {channel === 'wholesale' ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('net_terms_invoice')}
                    className={`flex items-center gap-2 p-2.5 text-xs rounded border transition-colors ${
                      paymentMethod === 'net_terms_invoice'
                        ? 'bg-slate-800 border-blue-500 text-white font-semibold'
                        : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    <span>Net 30 Terms</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('wire_transfer');
                      if (!generatedBankRef) {
                        setGeneratedBankRef(`BNK-TX-${Math.floor(10000 + Math.random() * 90000)}`);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 text-xs rounded border transition-colors ${
                      paymentMethod === 'wire_transfer'
                        ? 'bg-slate-800 border-blue-500 text-white font-semibold'
                        : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Building className="w-4 h-4 text-blue-400" />
                    <span>Direct Wire / ACH</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bank Transfer Auto-Verification Panel */}
            {(paymentMethod === 'bank_transfer' || paymentMethod === 'wire_transfer') && (
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Settlement Bank Account
                    </span>
                    <span className="font-semibold text-white text-xs">
                      {defaultBank?.bankName || 'JPMorgan Chase Bank'} ({defaultBank?.accountNumber || '•••• 6821'})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    REF: {generatedBankRef || 'BNK-TX-PENDING'}
                  </span>
                </div>

                {bankVerifiedDone ? (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-lg flex items-center justify-between text-emerald-300 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">PAYMENT AUTO-VERIFIED & DONE</span>
                    </div>
                    <span className="text-[10px] text-emerald-400">Cleared in Bank</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={bankAutoVerifying}
                    onClick={() => {
                      setBankAutoVerifying(true);
                      setTimeout(() => {
                        setBankAutoVerifying(false);
                        setBankVerifiedDone(true);
                      }, 900);
                    }}
                    className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {bankAutoVerifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Querying Linked Bank Network & Verifying Funds...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Auto-Verify Bank Transfer (${grandTotal.toFixed(2)})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Cash Drawer Calculator */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2 p-3 bg-slate-950/80 rounded border border-slate-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cash Received:</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`e.g. ${grandTotal.toFixed(2)}`}
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    className="w-28 px-2 py-1 text-right font-mono bg-slate-900 border border-slate-700 text-slate-100 rounded focus:outline-hidden"
                  />
                </div>
                {/* Fast Cash Quick Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTenderedInput(amt.toString())}
                      className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTenderedInput(grandTotal.toFixed(2))}
                    className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 rounded text-emerald-400"
                  >
                    Exact
                  </button>
                </div>
                {parseFloat(cashTenderedInput) > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 font-bold font-mono">
                    <span>Change Due:</span>
                    <span>
                      $
                      {Math.max(
                        0,
                        (parseFloat(cashTenderedInput) || 0) - grandTotal
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Transaction Notes / PO #:</label>
              <input
                type="text"
                placeholder="Optional PO number or cashier notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
              >
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Receipt / Invoice Modal */}
      {completedOrder && (
        <ReceiptModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </div>
  );
};
