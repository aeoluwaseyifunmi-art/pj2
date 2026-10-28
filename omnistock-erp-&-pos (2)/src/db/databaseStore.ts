import {
  Location,
  Product,
  PriceTier,
  InventoryLevel,
  Customer,
  Order,
  OrderItem,
  StockMovement,
  RegisterShift,
  MovementType,
  Inputer,
  InputerActivity,
  LinkedBankAccount,
  BankTransaction,
  PurchaseOrder,
  AuditLogEntry
} from '../types/database';

import {
  INITIAL_LOCATIONS,
  INITIAL_PRODUCTS,
  INITIAL_PRICE_TIERS,
  INITIAL_INVENTORY,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SHIFTS,
  INITIAL_INPUTERS,
  INITIAL_INPUTER_ACTIVITIES,
  INITIAL_LINKED_BANKS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDIT_LOGS
} from './initialData';

export interface DatabaseState {
  locations: Location[];
  products: Product[];
  priceTiers: PriceTier[];
  inventory: InventoryLevel[];
  customers: Customer[];
  orders: Order[];
  stockMovements: StockMovement[];
  shifts: RegisterShift[];
  inputers: Inputer[];
  inputerActivities: InputerActivity[];
  customCategories?: string[];
  linkedBankAccounts: LinkedBankAccount[];
  bankTransactions: BankTransaction[];
  purchaseOrders: PurchaseOrder[];
  auditLogs: AuditLogEntry[];
}

const STORAGE_KEY = 'omnistock_db_state_v1';

class DatabaseStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify key tables exist
        if (parsed.products && parsed.inventory && parsed.orders) {
          if (!parsed.inputers || !Array.isArray(parsed.inputers) || parsed.inputers.length === 0) {
            parsed.inputers = [...INITIAL_INPUTERS];
          }
          if (!parsed.inputerActivities || !Array.isArray(parsed.inputerActivities) || parsed.inputerActivities.length === 0) {
            parsed.inputerActivities = [...INITIAL_INPUTER_ACTIVITIES];
          }
          if (!parsed.linkedBankAccounts || !Array.isArray(parsed.linkedBankAccounts) || parsed.linkedBankAccounts.length === 0) {
            parsed.linkedBankAccounts = [...INITIAL_LINKED_BANKS];
          }
          if (!parsed.bankTransactions || !Array.isArray(parsed.bankTransactions)) {
            parsed.bankTransactions = [...INITIAL_BANK_TRANSACTIONS];
          }
          if (!parsed.purchaseOrders || !Array.isArray(parsed.purchaseOrders) || parsed.purchaseOrders.length === 0) {
            parsed.purchaseOrders = [...INITIAL_PURCHASE_ORDERS];
          }
          if (!parsed.auditLogs || !Array.isArray(parsed.auditLogs) || parsed.auditLogs.length === 0) {
            parsed.auditLogs = [...INITIAL_AUDIT_LOGS];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using initial dataset:', e);
    }

    return {
      locations: [...INITIAL_LOCATIONS],
      products: [...INITIAL_PRODUCTS],
      priceTiers: [...INITIAL_PRICE_TIERS],
      inventory: [...INITIAL_INVENTORY],
      customers: [...INITIAL_CUSTOMERS],
      orders: [...INITIAL_ORDERS],
      stockMovements: [...INITIAL_STOCK_MOVEMENTS],
      shifts: [...INITIAL_SHIFTS],
      inputers: [...INITIAL_INPUTERS],
      inputerActivities: [...INITIAL_INPUTER_ACTIVITIES],
      linkedBankAccounts: [...INITIAL_LINKED_BANKS],
      bankTransactions: [...INITIAL_BANK_TRANSACTIONS],
      purchaseOrders: [...INITIAL_PURCHASE_ORDERS],
      auditLogs: [...INITIAL_AUDIT_LOGS]
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save database state to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): DatabaseState {
    if (!this.state.linkedBankAccounts || !Array.isArray(this.state.linkedBankAccounts)) {
      this.state.linkedBankAccounts = [...INITIAL_LINKED_BANKS];
    }
    if (!this.state.bankTransactions || !Array.isArray(this.state.bankTransactions)) {
      this.state.bankTransactions = [...INITIAL_BANK_TRANSACTIONS];
    }
    if (!this.state.locations || !Array.isArray(this.state.locations)) {
      this.state.locations = [...INITIAL_LOCATIONS];
    }
    if (!this.state.products || !Array.isArray(this.state.products)) {
      this.state.products = [...INITIAL_PRODUCTS];
    }
    if (!this.state.purchaseOrders || !Array.isArray(this.state.purchaseOrders)) {
      this.state.purchaseOrders = [...INITIAL_PURCHASE_ORDERS];
    }
    if (!this.state.auditLogs || !Array.isArray(this.state.auditLogs)) {
      this.state.auditLogs = [...INITIAL_AUDIT_LOGS];
    }
    return this.state;
  }

  public resetToFactory() {
    this.state = {
      locations: [...INITIAL_LOCATIONS],
      products: [...INITIAL_PRODUCTS],
      priceTiers: [...INITIAL_PRICE_TIERS],
      inventory: [...INITIAL_INVENTORY],
      customers: [...INITIAL_CUSTOMERS],
      orders: [...INITIAL_ORDERS],
      stockMovements: [...INITIAL_STOCK_MOVEMENTS],
      shifts: [...INITIAL_SHIFTS],
      inputers: [...INITIAL_INPUTERS],
      inputerActivities: [...INITIAL_INPUTER_ACTIVITIES],
      linkedBankAccounts: [...INITIAL_LINKED_BANKS],
      bankTransactions: [...INITIAL_BANK_TRANSACTIONS],
      purchaseOrders: [...INITIAL_PURCHASE_ORDERS],
      auditLogs: [...INITIAL_AUDIT_LOGS]
    };
    this.saveState();
  }

  // --- Inventory & Pricing Methods ---

  public getProductStock(productId: string, locationId?: string): number {
    const records = this.state.inventory.filter((inv) => {
      if (locationId) return inv.productId === productId && inv.locationId === locationId;
      return inv.productId === productId;
    });
    return records.reduce((sum, r) => sum + r.quantityOnHand, 0);
  }

  public getProductStockDetails(productId: string) {
    return this.state.inventory
      .filter((inv) => inv.productId === productId)
      .map((inv) => {
        const loc = this.state.locations.find((l) => l.id === inv.locationId);
        return {
          ...inv,
          locationName: loc ? loc.name : inv.locationId,
          locationCode: loc ? loc.code : 'UNKNOWN'
        };
      });
  }

  public calculateProductPrice(
    productId: string,
    quantity: number,
    isWholesale: boolean,
    customerDiscountPercent = 0
  ): {
    unitPrice: number;
    originalPrice: number;
    tierName?: string;
    discountPercent: number;
  } {
    const product = this.state.products.find((p) => p.id === productId);
    if (!product) return { unitPrice: 0, originalPrice: 0, discountPercent: 0 };

    if (!isWholesale) {
      const unitPrice =
        customerDiscountPercent > 0
          ? Number((product.retailPrice * (1 - customerDiscountPercent / 100)).toFixed(2))
          : product.retailPrice;
      return {
        unitPrice,
        originalPrice: product.retailPrice,
        discountPercent: customerDiscountPercent
      };
    }

    // Wholesale calculation: check applicable price tiers
    const tiers = this.state.priceTiers
      .filter((t) => t.productId === productId && quantity >= t.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity);

    if (tiers.length > 0) {
      const bestTier = tiers[0];
      return {
        unitPrice: bestTier.unitPrice,
        originalPrice: product.retailPrice,
        tierName: bestTier.tierLabel,
        discountPercent: bestTier.discountPercent
      };
    }

    // Default wholesale base price if quantity is below tiers
    const wholesalePrice =
      quantity >= product.minWholesaleQty ? product.wholesaleBasePrice : product.retailPrice;

    return {
      unitPrice: wholesalePrice,
      originalPrice: product.retailPrice,
      tierName: quantity >= product.minWholesaleQty ? 'Wholesale Base (MOQ Met)' : undefined,
      discountPercent:
        quantity >= product.minWholesaleQty
          ? Number((((product.retailPrice - product.wholesaleBasePrice) / product.retailPrice) * 100).toFixed(1))
          : 0
    };
  }

  public deductStock(
    productId: string,
    locationId: string,
    quantity: number,
    movementType: MovementType,
    referenceNumber: string,
    reason: string,
    operator: string
  ): boolean {
    const invIndex = this.state.inventory.findIndex(
      (inv) => inv.productId === productId && inv.locationId === locationId
    );

    let prevQty = 0;
    let newQty = 0;

    if (invIndex >= 0) {
      prevQty = this.state.inventory[invIndex].quantityOnHand;
      newQty = Math.max(0, prevQty - quantity);
      this.state.inventory[invIndex] = {
        ...this.state.inventory[invIndex],
        quantityOnHand: newQty,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create record if not found
      prevQty = 0;
      newQty = 0;
      this.state.inventory.push({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId,
        locationId,
        quantityOnHand: 0,
        quantityReserved: 0,
        batchLot: 'LOT-NEW',
        binLocation: 'Pending Assignment',
        updatedAt: new Date().toISOString()
      });
    }

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      productId,
      locationId,
      type: movementType,
      quantityChange: -quantity,
      previousQty: prevQty,
      newQty,
      referenceNumber,
      reason,
      operator
    };

    this.state.stockMovements.unshift(movement);
    this.saveState();
    return true;
  }

  public restockProduct(
    productId: string,
    locationId: string,
    quantity: number,
    batchLot: string,
    expiryDate: string | undefined,
    referenceNumber: string,
    reason: string,
    operator: string
  ): boolean {
    const invIndex = this.state.inventory.findIndex(
      (inv) => inv.productId === productId && inv.locationId === locationId
    );

    let prevQty = 0;
    let newQty = quantity;

    if (invIndex >= 0) {
      prevQty = this.state.inventory[invIndex].quantityOnHand;
      newQty = prevQty + quantity;
      this.state.inventory[invIndex] = {
        ...this.state.inventory[invIndex],
        quantityOnHand: newQty,
        batchLot: batchLot || this.state.inventory[invIndex].batchLot,
        expiryDate: expiryDate || this.state.inventory[invIndex].expiryDate,
        updatedAt: new Date().toISOString()
      };
    } else {
      this.state.inventory.push({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId,
        locationId,
        quantityOnHand: quantity,
        quantityReserved: 0,
        batchLot: batchLot || 'LOT-RESTOCK',
        expiryDate,
        binLocation: 'Main Shelf',
        updatedAt: new Date().toISOString()
      });
    }

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      productId,
      locationId,
      type: 'purchase_restock',
      quantityChange: quantity,
      previousQty: prevQty,
      newQty,
      referenceNumber: referenceNumber || `PO-${Date.now().toString().slice(-4)}`,
      reason: reason || 'Inventory Restock Inbound',
      operator: operator || 'Inventory Manager'
    };

    this.state.stockMovements.unshift(movement);
    this.saveState();
    return true;
  }

  public transferStock(
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    reason: string,
    operator: string
  ): { success: boolean; error?: string } {
    if (fromLocationId === toLocationId) {
      return { success: false, error: 'Source and destination locations cannot be identical.' };
    }

    const fromIndex = this.state.inventory.findIndex(
      (i) => i.productId === productId && i.locationId === fromLocationId
    );
    if (fromIndex < 0 || this.state.inventory[fromIndex].quantityOnHand < quantity) {
      return {
        success: false,
        error: `Insufficient stock at source location. Available: ${fromIndex >= 0 ? this.state.inventory[fromIndex].quantityOnHand : 0}`
      };
    }

    const refNum = `TRF-${Date.now().toString().slice(-5)}`;
    const timestamp = new Date().toISOString();

    // Deduct from source
    const sourcePrev = this.state.inventory[fromIndex].quantityOnHand;
    const sourceNew = sourcePrev - quantity;
    this.state.inventory[fromIndex].quantityOnHand = sourceNew;
    this.state.inventory[fromIndex].updatedAt = timestamp;

    this.state.stockMovements.unshift({
      id: `sm_${Date.now()}_src`,
      timestamp,
      productId,
      locationId: fromLocationId,
      type: 'transfer_out',
      quantityChange: -quantity,
      previousQty: sourcePrev,
      newQty: sourceNew,
      referenceNumber: refNum,
      reason: `Transfer outbound to ${this.getLocationName(toLocationId)}: ${reason}`,
      operator
    });

    // Add to destination
    const toIndex = this.state.inventory.findIndex(
      (i) => i.productId === productId && i.locationId === toLocationId
    );
    let destPrev = 0;
    let destNew = quantity;

    if (toIndex >= 0) {
      destPrev = this.state.inventory[toIndex].quantityOnHand;
      destNew = destPrev + quantity;
      this.state.inventory[toIndex].quantityOnHand = destNew;
      this.state.inventory[toIndex].updatedAt = timestamp;
    } else {
      this.state.inventory.push({
        id: `inv_${Date.now()}_dest`,
        productId,
        locationId: toLocationId,
        quantityOnHand: quantity,
        quantityReserved: 0,
        batchLot: this.state.inventory[fromIndex].batchLot,
        binLocation: 'Transit Shelf',
        updatedAt: timestamp
      });
    }

    this.state.stockMovements.unshift({
      id: `sm_${Date.now()}_dest`,
      timestamp,
      productId,
      locationId: toLocationId,
      type: 'transfer_in',
      quantityChange: quantity,
      previousQty: destPrev,
      newQty: destNew,
      referenceNumber: refNum,
      reason: `Transfer inbound from ${this.getLocationName(fromLocationId)}: ${reason}`,
      operator
    });

    this.saveState();
    return { success: true };
  }

  public adjustStock(
    productId: string,
    locationId: string,
    newQuantity: number,
    reason: string,
    operator: string
  ): boolean {
    const invIndex = this.state.inventory.findIndex(
      (i) => i.productId === productId && i.locationId === locationId
    );

    let prevQty = 0;
    if (invIndex >= 0) {
      prevQty = this.state.inventory[invIndex].quantityOnHand;
      this.state.inventory[invIndex].quantityOnHand = newQuantity;
      this.state.inventory[invIndex].updatedAt = new Date().toISOString();
    } else {
      this.state.inventory.push({
        id: `inv_${Date.now()}`,
        productId,
        locationId,
        quantityOnHand: newQuantity,
        quantityReserved: 0,
        batchLot: 'LOT-ADJ',
        binLocation: 'General Bin',
        updatedAt: new Date().toISOString()
      });
    }

    const diff = newQuantity - prevQty;
    const refNumber = `ADJ-${Date.now().toString().slice(-4)}`;
    this.state.stockMovements.unshift({
      id: `sm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId,
      locationId,
      type: diff >= 0 ? 'purchase_restock' : 'adjustment_loss',
      quantityChange: diff,
      previousQty: prevQty,
      newQty: newQuantity,
      referenceNumber: refNumber,
      reason: reason || 'Manual Physical Audit Adjustment',
      operator
    });

    // Record Inputer Activity if operator matches an inputer
    const matchedInputer = this.state.inputers.find(
      (i) => i.name.toLowerCase() === operator.toLowerCase() || i.staffCode.toUpperCase() === operator.toUpperCase()
    );
    if (matchedInputer) {
      const prod = this.state.products.find((p) => p.id === productId);
      const loc = this.state.locations.find((l) => l.id === locationId);
      this.recordInputerActivity({
        inputerId: matchedInputer.staffCode,
        inputerName: matchedInputer.name,
        actionType: 'stock_adjustment',
        title: 'Inventory Stock Adjustment',
        description: `Adjusted ${prod?.name || productId} stock by ${diff >= 0 ? '+' : ''}${diff} units (${reason || 'Audit Adjustment'})`,
        locationId,
        locationName: loc?.name,
        referenceNumber: refNumber
      });
    }

    this.saveState();
    return true;
  }

  // --- POS & Order Execution ---

  public processOrder(orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order {
    const isWholesale = orderPayload.channel === 'wholesale';
    const prefix = isWholesale ? 'INV-WS' : 'POS-2026';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `${prefix}-${randomDigits}`;

    const newOrder: Order = {
      ...orderPayload,
      id: `ord_${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString()
    };

    // Deduct stock for each line item
    orderPayload.items.forEach((item) => {
      this.deductStock(
        item.productId,
        orderPayload.locationId,
        item.quantity,
        isWholesale ? 'wholesale_fulfillment' : 'sale',
        orderNumber,
        isWholesale
          ? `Wholesale order to ${orderPayload.customerCompany || orderPayload.customerName}`
          : 'POS Register Sale',
        orderPayload.cashier
      );
    });

    // Update Customer outstanding balance if Net Terms
    if (isWholesale && orderPayload.paymentStatus === 'pending_net30') {
      const custIndex = this.state.customers.findIndex((c) => c.id === orderPayload.customerId);
      if (custIndex >= 0) {
        this.state.customers[custIndex].outstandingBalance += orderPayload.grandTotal;
      }
    }

    // Update open shift if matching location
    const openShift = this.state.shifts.find(
      (s) => s.locationId === orderPayload.locationId && s.status === 'open'
    );
    if (openShift) {
      if (orderPayload.paymentMethod === 'cash') {
        openShift.cashCollected += orderPayload.grandTotal;
        openShift.expectedCash = openShift.openingFloat + openShift.cashCollected;
      } else if (orderPayload.paymentMethod === 'credit_card' || orderPayload.paymentMethod === 'debit_card') {
        openShift.cardCollected += orderPayload.grandTotal;
      }
    }

    // Auto-verify Bank Transfer and record in Bank Settlement ledger
    if (orderPayload.paymentMethod === 'bank_transfer' || orderPayload.paymentMethod === 'wire_transfer') {
      const bank = orderPayload.bankAccountId
        ? this.state.linkedBankAccounts.find((b) => b.id === orderPayload.bankAccountId)
        : this.getDefaultBankAccount();

      const bankRef = orderPayload.bankTransactionRef || `BNK-TX-${Math.floor(10000 + Math.random() * 90000)}`;
      newOrder.bankAccountId = bank ? bank.id : 'bnk_default';
      newOrder.bankName = bank ? bank.bankName : 'Linked Settlement Bank';
      newOrder.bankTransactionRef = bankRef;
      newOrder.bankVerified = true;
      newOrder.bankVerifiedAt = new Date().toISOString();

      if (bank) {
        this.recordBankTransaction({
          bankAccountId: bank.id,
          bankName: bank.bankName,
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          referenceCode: bankRef,
          type: isWholesale ? 'wholesale_settlement' : 'credit_sale',
          amount: newOrder.grandTotal,
          currency: 'USD',
          senderName: orderPayload.customerCompany || orderPayload.customerName || 'Direct Customer',
          status: 'verified',
          verifiedAt: newOrder.bankVerifiedAt,
          verifiedBy: 'instant_api',
          description: `Instant verified bank settlement for order ${newOrder.orderNumber}`
        });
      }
    }

    // Update Inputer metrics if assigned
    if (orderPayload.inputerId) {
      const inp = this.state.inputers.find(
        (i) => i.id === orderPayload.inputerId || i.staffCode === orderPayload.inputerId
      );
      if (inp) {
        inp.totalSalesVolume = Number((inp.totalSalesVolume + newOrder.grandTotal).toFixed(2));
        inp.lastActiveAt = new Date().toISOString();
        if (newOrder.receiptPrinted) {
          inp.receiptsPrintedCount += 1;
        }

        const inputerDisplayName = inp.name || orderPayload.inputerName || orderPayload.cashier;
        this.recordInputerActivity({
          inputerId: inp.staffCode,
          inputerName: inputerDisplayName,
          actionType: 'sale_completed',
          title: orderPayload.channel === 'wholesale' ? 'Wholesale Invoice Executed' : 'POS Sale Completed',
          description: `Processed ${orderPayload.channel} sale of ${orderPayload.items.length} line item(s) to ${orderPayload.customerCompany || orderPayload.customerName}`,
          locationId: orderPayload.locationId,
          locationName: orderPayload.locationName,
          referenceNumber: newOrder.orderNumber,
          amount: newOrder.grandTotal
        });

        if (newOrder.receiptPrinted) {
          this.recordInputerActivity({
            inputerId: inp.staffCode,
            inputerName: inputerDisplayName,
            actionType: 'receipt_printed',
            title: 'Thermal Receipt Printed',
            description: `Generated 80mm register customer receipt for ${newOrder.orderNumber}`,
            locationId: orderPayload.locationId,
            locationName: orderPayload.locationName,
            referenceNumber: newOrder.orderNumber,
            amount: newOrder.grandTotal
          });
        }
      }
    }

    this.state.orders.unshift(newOrder);
    this.saveState();
    return newOrder;
  }

  // --- Inputer & Staff Terminal Methods ---

  public getInputers(): Inputer[] {
    return this.state.inputers;
  }

  public getInputerById(id: string): Inputer | undefined {
    return this.state.inputers.find((i) => i.id === id || i.staffCode === id);
  }

  public addInputer(data: Omit<Inputer, 'id' | 'createdAt' | 'receiptsPrintedCount' | 'totalSalesVolume'>): Inputer {
    const id = `inp_${Date.now()}`;
    const newInputer: Inputer = {
      ...data,
      id,
      receiptsPrintedCount: 0,
      totalSalesVolume: 0,
      createdAt: new Date().toISOString()
    };
    this.state.inputers.push(newInputer);
    this.saveState();
    return newInputer;
  }

  public updateInputer(id: string, updates: Partial<Inputer>): boolean {
    const index = this.state.inputers.findIndex((i) => i.id === id);
    if (index < 0) return false;
    const oldInputer = this.state.inputers[index];
    this.state.inputers[index] = {
      ...oldInputer,
      ...updates
    };

    if (updates.pin && updates.pin !== oldInputer.pin) {
      this.recordInputerActivity({
        inputerId: oldInputer.staffCode,
        inputerName: oldInputer.name,
        actionType: 'pin_updated',
        title: 'Security PIN Updated',
        description: '4-digit terminal access PIN reset by administrator'
      });
    }

    this.saveState();
    return true;
  }

  public deleteInputer(id: string): boolean {
    const index = this.state.inputers.findIndex((i) => i.id === id);
    if (index < 0) return false;
    this.state.inputers.splice(index, 1);
    this.saveState();
    return true;
  }

  public authenticateInputer(staffCodeOrId: string, pin: string): { success: boolean; inputer?: Inputer; message: string } {
    const cleanQuery = staffCodeOrId.trim().toUpperCase();
    const inputer = this.state.inputers.find(
      (i) => i.staffCode.toUpperCase() === cleanQuery || i.id === staffCodeOrId.trim()
    );

    if (!inputer) {
      return { success: false, message: `Staff account "${staffCodeOrId}" not found.` };
    }

    if (inputer.status === 'suspended') {
      return { success: false, message: `Account for ${inputer.name} is currently suspended. Please contact the administrator.` };
    }

    if (inputer.pin !== pin.trim()) {
      return { success: false, message: 'Invalid 4-digit security PIN.' };
    }

    inputer.lastActiveAt = new Date().toISOString();
    const loc = this.state.locations.find((l) => l.id === inputer.assignedLocationId);

    this.recordInputerActivity({
      inputerId: inputer.staffCode,
      inputerName: inputer.name,
      actionType: 'login',
      title: 'Terminal Station Authenticated',
      description: `Staff PIN verified on POS Web Terminal`,
      locationId: inputer.assignedLocationId,
      locationName: loc?.name
    });

    this.saveState();
    return { success: true, inputer, message: `Welcome, ${inputer.name}` };
  }

  public recordReceiptPrinted(orderId: string, inputerId?: string): void {
    const ord = this.state.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (ord) {
      ord.receiptPrinted = true;
    }

    const targetInputerId = inputerId || ord?.inputerId;
    if (targetInputerId) {
      const inp = this.state.inputers.find((i) => i.id === targetInputerId || i.staffCode === targetInputerId);
      if (inp) {
        inp.receiptsPrintedCount += 1;
        inp.lastActiveAt = new Date().toISOString();

        this.recordInputerActivity({
          inputerId: inp.staffCode,
          inputerName: inp.name,
          actionType: 'receipt_printed',
          title: 'Receipt Printed / Reprinted',
          description: `Issued thermal customer receipt copy for ${ord?.orderNumber || orderId}`,
          locationId: ord?.locationId || inp.assignedLocationId,
          locationName: ord?.locationName,
          referenceNumber: ord?.orderNumber || orderId,
          amount: ord?.grandTotal
        });
      }
    }
    this.saveState();
  }

  // --- Real-time Activity Log Queries ---

  public getInputerActivities(inputerId?: string, limitCount = 10): InputerActivity[] {
    const list = this.state.inputerActivities || [];
    if (!inputerId || inputerId === 'all') {
      return list.slice(0, limitCount);
    }
    const clean = inputerId.trim().toUpperCase();
    return list
      .filter((a) => a.inputerId.toUpperCase() === clean || a.inputerName.toUpperCase() === clean)
      .slice(0, limitCount);
  }

  public recordInputerActivity(
    activity: Omit<InputerActivity, 'id' | 'timestamp'>
  ): InputerActivity {
    const newAct: InputerActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    if (!this.state.inputerActivities) {
      this.state.inputerActivities = [];
    }
    this.state.inputerActivities.unshift(newAct);

    // Keep log bounded
    if (this.state.inputerActivities.length > 300) {
      this.state.inputerActivities = this.state.inputerActivities.slice(0, 300);
    }

    this.saveState();
    return newAct;
  }

  public closeShift(shiftId: string, actualCashCount: number): RegisterShift | undefined {
    const shiftIndex = this.state.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex < 0) return undefined;

    const shift = this.state.shifts[shiftIndex];
    const expected = shift.openingFloat + shift.cashCollected;
    const variance = Number((actualCashCount - expected).toFixed(2));

    this.state.shifts[shiftIndex] = {
      ...shift,
      status: 'closed',
      closedAt: new Date().toISOString(),
      actualCashCount,
      cashVariance: variance
    };

    this.saveState();
    return this.state.shifts[shiftIndex];
  }

  public openNewShift(locationId: string, cashier: string, openingFloat: number): RegisterShift {
    const newShift: RegisterShift = {
      id: `shift_${Date.now()}`,
      registerId: `REG-${Date.now().toString().slice(-4)}`,
      locationId,
      cashier,
      openingFloat,
      openedAt: new Date().toISOString(),
      cashCollected: 0,
      cardCollected: 0,
      expectedCash: openingFloat,
      status: 'open'
    };

    this.state.shifts.unshift(newShift);
    this.saveState();
    return newShift;
  }

  // --- CRUD helpers ---

  public addProduct(product: Omit<Product, 'id'>, initialStock: number, locationId: string): Product {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`
    };

    this.state.products.push(newProduct);

    // Seed inventory for this product at the specified location
    this.state.inventory.push({
      id: `inv_${Date.now()}`,
      productId: newProduct.id,
      locationId: locationId || 'loc_wh_central',
      quantityOnHand: initialStock,
      quantityReserved: 0,
      batchLot: 'LOT-NEW-INIT',
      binLocation: 'Aisle 1',
      updatedAt: new Date().toISOString()
    });

    this.state.stockMovements.unshift({
      id: `sm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: newProduct.id,
      locationId: locationId || 'loc_wh_central',
      type: 'purchase_restock',
      quantityChange: initialStock,
      previousQty: 0,
      newQty: initialStock,
      referenceNumber: 'INIT-NEW-SKU',
      reason: 'Initial SKU Registration & Stock Ingestion',
      operator: 'System Admin'
    });

    this.saveState();
    return newProduct;
  }

  public updateProduct(
    id: string,
    updates: Partial<Product>,
    stockAdjustment?: { locationId?: string; newStock: number }
  ): boolean {
    const index = this.state.products.findIndex((p) => p.id === id);
    if (index < 0) return false;
    this.state.products[index] = {
      ...this.state.products[index],
      ...updates
    };

    if (stockAdjustment && typeof stockAdjustment.newStock === 'number') {
      const locId = stockAdjustment.locationId || 'loc_wh_central';
      const invIndex = this.state.inventory.findIndex(
        (inv) => inv.productId === id && inv.locationId === locId
      );
      if (invIndex >= 0) {
        this.state.inventory[invIndex].quantityOnHand = stockAdjustment.newStock;
        this.state.inventory[invIndex].updatedAt = new Date().toISOString();
      } else {
        this.state.inventory.push({
          id: `inv_${Date.now()}`,
          productId: id,
          locationId: locId,
          quantityOnHand: stockAdjustment.newStock,
          quantityReserved: 0,
          batchLot: 'LOT-UPDATE',
          binLocation: 'General Shelf',
          updatedAt: new Date().toISOString()
        });
      }
    }

    this.saveState();
    return true;
  }

  public deleteProduct(id: string): boolean {
    const index = this.state.products.findIndex((p) => p.id === id);
    if (index < 0) return false;
    this.state.products.splice(index, 1);
    this.state.inventory = this.state.inventory.filter((inv) => inv.productId !== id);
    this.saveState();
    return true;
  }

  public addPriceTier(tier: Omit<PriceTier, 'id'>): PriceTier {
    const newTier: PriceTier = {
      ...tier,
      id: `tier_${Date.now()}`
    };
    this.state.priceTiers.push(newTier);
    this.saveState();
    return newTier;
  }

  public addCustomer(customer: Omit<Customer, 'id' | 'outstandingBalance'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: `cust_${Date.now()}`,
      outstandingBalance: 0
    };
    this.state.customers.push(newCustomer);
    this.saveState();
    return newCustomer;
  }

  public getLocationName(locationId: string): string {
    const loc = this.state.locations.find((l) => l.id === locationId);
    return loc ? loc.name : locationId;
  }

  public getActiveLocationId(): string {
    try {
      const stored = localStorage.getItem('omnistock_active_location_id');
      if (stored && this.state.locations.some((l) => l.id === stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    const primary = this.state.locations.find((l) => l.isPrimary);
    return primary ? primary.id : (this.state.locations[0]?.id || 'loc_wh_central');
  }

  public setActiveLocationId(id: string): void {
    try {
      localStorage.setItem('omnistock_active_location_id', id);
    } catch {
      // ignore
    }
    this.notify();
  }

  public addLocation(location: Omit<Location, 'id'>): Location {
    const newLocation: Location = {
      ...location,
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    if (newLocation.isPrimary) {
      this.state.locations.forEach((l) => {
        l.isPrimary = false;
      });
    }

    this.state.locations.push(newLocation);
    this.saveState();
    return newLocation;
  }

  public updateLocation(id: string, updates: Partial<Location>): boolean {
    const index = this.state.locations.findIndex((l) => l.id === id);
    if (index < 0) return false;

    if (updates.isPrimary) {
      this.state.locations.forEach((l) => {
        l.isPrimary = false;
      });
    }

    this.state.locations[index] = {
      ...this.state.locations[index],
      ...updates
    };

    this.saveState();
    return true;
  }

  public deleteLocation(id: string): boolean {
    if (this.state.locations.length <= 1) {
      return false; // cannot delete the last location
    }
    const index = this.state.locations.findIndex((l) => l.id === id);
    if (index < 0) return false;

    const wasPrimary = this.state.locations[index].isPrimary;
    this.state.locations.splice(index, 1);

    if (wasPrimary && this.state.locations.length > 0) {
      this.state.locations[0].isPrimary = true;
    }

    if (this.getActiveLocationId() === id) {
      this.setActiveLocationId(this.state.locations[0].id);
    }

    this.saveState();
    return true;
  }

  // --- Category Management ---
  public getCategories(): string[] {
    const set = new Set<string>();
    ['Specialty Coffee', 'Gourmet Pantry', 'Artisan Bakery', 'Hardware & Peripherals'].forEach((c) => set.add(c));
    this.state.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    (this.state.customCategories || []).forEach((c) => {
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }

  public addCategory(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (!this.state.customCategories) {
      this.state.customCategories = [];
    }
    if (!this.state.customCategories.includes(trimmed)) {
      this.state.customCategories.push(trimmed);
      this.saveState();
      return true;
    }
    return false;
  }

  public deleteCategory(name: string): boolean {
    if (!this.state.customCategories) return false;
    const initialLen = this.state.customCategories.length;
    this.state.customCategories = this.state.customCategories.filter((c) => c !== name);
    if (this.state.customCategories.length !== initialLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  public clearAllProducts(): void {
    this.state.products = [];
    this.state.inventory = [];
    this.saveState();
  }

  // --- Bank & Settlement Management ---
  public getLinkedBankAccounts(): LinkedBankAccount[] {
    return this.state.linkedBankAccounts || [];
  }

  public getDefaultBankAccount(): LinkedBankAccount | undefined {
    const banks = this.getLinkedBankAccounts();
    return banks.find((b) => b.isDefault) || banks[0];
  }

  public addLinkedBankAccount(account: Omit<LinkedBankAccount, 'id' | 'lastSyncedAt'>): LinkedBankAccount {
    const newBank: LinkedBankAccount = {
      ...account,
      id: `bnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lastSyncedAt: new Date().toISOString()
    };

    if (!this.state.linkedBankAccounts) {
      this.state.linkedBankAccounts = [];
    }

    if (newBank.isDefault) {
      this.state.linkedBankAccounts.forEach((b) => {
        b.isDefault = false;
      });
    } else if (this.state.linkedBankAccounts.length === 0) {
      newBank.isDefault = true;
    }

    this.state.linkedBankAccounts.push(newBank);
    this.saveState();
    return newBank;
  }

  public updateLinkedBankAccount(id: string, updates: Partial<LinkedBankAccount>): boolean {
    if (!this.state.linkedBankAccounts) return false;
    const index = this.state.linkedBankAccounts.findIndex((b) => b.id === id);
    if (index < 0) return false;

    if (updates.isDefault) {
      this.state.linkedBankAccounts.forEach((b) => {
        b.isDefault = false;
      });
    }

    this.state.linkedBankAccounts[index] = {
      ...this.state.linkedBankAccounts[index],
      ...updates
    };
    this.saveState();
    return true;
  }

  public deleteLinkedBankAccount(id: string): boolean {
    if (!this.state.linkedBankAccounts || this.state.linkedBankAccounts.length <= 1) {
      return false; // keep at least 1 account
    }
    const index = this.state.linkedBankAccounts.findIndex((b) => b.id === id);
    if (index < 0) return false;

    const wasDefault = this.state.linkedBankAccounts[index].isDefault;
    this.state.linkedBankAccounts.splice(index, 1);
    if (wasDefault && this.state.linkedBankAccounts.length > 0) {
      this.state.linkedBankAccounts[0].isDefault = true;
    }
    this.saveState();
    return true;
  }

  public setDefaultBankAccount(id: string): boolean {
    if (!this.state.linkedBankAccounts) return false;
    const bank = this.state.linkedBankAccounts.find((b) => b.id === id);
    if (!bank) return false;
    this.state.linkedBankAccounts.forEach((b) => {
      b.isDefault = b.id === id;
    });
    this.saveState();
    return true;
  }

  public getBankTransactions(): BankTransaction[] {
    return this.state.bankTransactions || [];
  }

  public recordBankTransaction(tx: Omit<BankTransaction, 'id' | 'createdAt'>): BankTransaction {
    const newTx: BankTransaction = {
      ...tx,
      id: `btx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    if (!this.state.bankTransactions) {
      this.state.bankTransactions = [];
    }
    this.state.bankTransactions.unshift(newTx);

    // Credit the linked bank account balance if verified
    if (newTx.status === 'verified') {
      const bank = (this.state.linkedBankAccounts || []).find((b) => b.id === newTx.bankAccountId);
      if (bank) {
        bank.balance = Number((bank.balance + newTx.amount).toFixed(2));
        bank.lastSyncedAt = new Date().toISOString();
      }
    }

    this.saveState();
    return newTx;
  }

  public verifyBankTransaction(referenceCodeOrId: string): boolean {
    if (!this.state.bankTransactions) return false;
    const tx = this.state.bankTransactions.find(
      (t) => t.id === referenceCodeOrId || t.referenceCode === referenceCodeOrId
    );
    if (!tx) return false;
    if (tx.status === 'verified') return true;

    tx.status = 'verified';
    tx.verifiedAt = new Date().toISOString();
    tx.verifiedBy = 'instant_api';

    const bank = (this.state.linkedBankAccounts || []).find((b) => b.id === tx.bankAccountId);
    if (bank) {
      bank.balance = Number((bank.balance + tx.amount).toFixed(2));
      bank.lastSyncedAt = new Date().toISOString();
    }

    // Also update order if matching
    if (tx.orderId || tx.orderNumber) {
      const order = this.state.orders.find(
        (o) => o.id === tx.orderId || o.orderNumber === tx.orderNumber
      );
      if (order) {
        order.bankVerified = true;
        order.bankVerifiedAt = tx.verifiedAt;
        order.paymentStatus = 'paid';
      }
    }

    this.saveState();
    return true;
  }

  public simulateIncomingBankTransfer(
    amount: number,
    senderName: string,
    orderNumber?: string,
    bankAccountId?: string
  ): BankTransaction {
    const bank = bankAccountId
      ? (this.state.linkedBankAccounts || []).find((b) => b.id === bankAccountId)
      : this.getDefaultBankAccount();

    const selectedBank = bank || (this.state.linkedBankAccounts && this.state.linkedBankAccounts[0]) || {
      id: 'bnk_primary',
      bankName: 'Linked Business Bank'
    };

    const refNum = `BNK-TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const tx = this.recordBankTransaction({
      bankAccountId: selectedBank.id,
      bankName: selectedBank.bankName,
      orderNumber,
      referenceCode: refNum,
      type: orderNumber ? 'credit_sale' : 'transfer_in',
      amount: Number(amount.toFixed(2)),
      currency: 'USD',
      senderName: senderName || 'Direct Bank Customer',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'auto_bank_webhook',
      description: orderNumber
        ? `Instant verified payment for ${orderNumber} via ${selectedBank.bankName}`
        : `Incoming bank transfer verified into ${selectedBank.bankName}`
    });

    return tx;
  }

  // --- Relational SQL Query Simulator ---
  public executeQuery(sqlString: string): {
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    rowCount: number;
    error?: string;
  } {
    const startTime = performance.now();
    const cleanSql = sqlString.trim();

    try {
      // Basic SQL parser for standard SELECT queries
      const selectMatch = cleanSql.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);

      if (!selectMatch) {
        // Fallback: evaluate table name from query
        const simpleTable = cleanSql.match(/FROM\s+([a-zA-Z_]+)/i);
        if (simpleTable && (this.state as any)[simpleTable[1]]) {
          const tableName = simpleTable[1];
          const rawData = (this.state as any)[tableName] || [];
          const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
          const rows = rawData.slice(0, 50).map((r: any) => columns.map((col) => r[col]));
          return {
            columns,
            rows,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            rowCount: rows.length
          };
        }
        return {
          columns: ['status', 'message'],
          rows: [['Query parsed', 'Executed successfully against database memory buffer.']],
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          rowCount: 1
        };
      }

      const [, rawCols, tableName, rawWhere, rawOrderBy, rawLimit] = selectMatch;

      // Map table name to state property
      const tableMap: Record<string, keyof DatabaseState> = {
        products: 'products',
        inventory: 'inventory',
        inventory_levels: 'inventory',
        locations: 'locations',
        price_tiers: 'priceTiers',
        customers: 'customers',
        orders: 'orders',
        stock_movements: 'stockMovements',
        shifts: 'shifts'
      };

      const key = tableMap[tableName.toLowerCase()];
      if (!key || !(this.state as any)[key]) {
        return {
          columns: ['error'],
          rows: [[`Table '${tableName}' does not exist in schema. Available tables: ${Object.keys(tableMap).join(', ')}`]],
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          rowCount: 0,
          error: `Table '${tableName}' not found`
        };
      }

      let data = [...(this.state as any)[key]];

      // Handle simple WHERE
      if (rawWhere) {
        const whereClause = rawWhere.trim();
        if (whereClause.includes('=')) {
          const [field, val] = whereClause.split('=').map((s) => s.trim().replace(/['"]/g, ''));
          data = data.filter((item) => {
            const itemVal = String(item[field] ?? '').toLowerCase();
            return itemVal === val.toLowerCase();
          });
        }
      }

      // Handle simple ORDER BY
      if (rawOrderBy) {
        const [field, dir] = rawOrderBy.trim().split(/\s+/);
        const isDesc = dir && dir.toUpperCase() === 'DESC';
        data.sort((a, b) => {
          const va = a[field];
          const vb = b[field];
          if (va < vb) return isDesc ? 1 : -1;
          if (va > vb) return isDesc ? -1 : 1;
          return 0;
        });
      }

      // Handle LIMIT
      if (rawLimit) {
        const lim = parseInt(rawLimit, 10);
        data = data.slice(0, lim);
      } else {
        data = data.slice(0, 100);
      }

      // Columns
      let columns: string[] = [];
      if (rawCols.trim() === '*') {
        columns = data.length > 0 ? Object.keys(data[0]) : [];
      } else {
        columns = rawCols.split(',').map((c) => c.trim());
      }

      const rows = data.map((item) => {
        return columns.map((col) => {
          const val = item[col];
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val !== undefined ? val : 'NULL';
        });
      });

      return {
        columns,
        rows,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        rowCount: rows.length
      };
    } catch (err: any) {
      return {
        columns: ['error'],
        rows: [[err.message || 'Error processing SQL statement']],
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        rowCount: 0,
        error: err.message
      };
    }
  }

  // --- Firestore Cloud Synchronization ---
  public async syncToCloudFirestore(): Promise<{ success: boolean; message: string }> {
    try {
      const { db, handleFirestoreError, OperationType } = await import('../services/firestoreDb');
      const { doc, setDoc } = await import('firebase/firestore');

      // Sync Products
      for (const prod of this.state.products) {
        try {
          await setDoc(doc(db, 'products', prod.id), prod);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
        }
      }

      // Sync Inventory Levels
      for (const inv of this.state.inventory) {
        try {
          await setDoc(doc(db, 'inventory_levels', inv.id), inv);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `inventory_levels/${inv.id}`);
        }
      }

      // Sync Locations
      for (const loc of this.state.locations) {
        try {
          await setDoc(doc(db, 'locations', loc.id), loc);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `locations/${loc.id}`);
        }
      }

      // Sync Customers
      for (const cust of this.state.customers) {
        try {
          await setDoc(doc(db, 'customers', cust.id), cust);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `customers/${cust.id}`);
        }
      }

      // Sync Orders
      for (const ord of this.state.orders) {
        try {
          await setDoc(doc(db, 'orders', ord.id), ord);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `orders/${ord.id}`);
        }
      }

      // Sync Inputers
      for (const inp of this.state.inputers) {
        try {
          await setDoc(doc(db, 'inputers', inp.id), inp);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `inputers/${inp.id}`);
        }
      }

      // Sync recent Inputer Activities (last 50)
      for (const act of (this.state.inputerActivities || []).slice(0, 50)) {
        try {
          await setDoc(doc(db, 'inputer_activities', act.id), act);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `inputer_activities/${act.id}`);
        }
      }

      return {
        success: true,
        message: `Successfully synchronized ${this.state.products.length} products, ${this.state.inventory.length} inventory records, ${this.state.inputers.length} staff inputers, and ${(this.state.inputerActivities || []).length} activity logs to Firestore Cloud database!`
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Firestore cloud synchronization failed'
      };
    }
  }

  public async fetchFromCloudFirestore(): Promise<{ success: boolean; message: string }> {
    try {
      const { db, handleFirestoreError, OperationType } = await import('../services/firestoreDb');
      const { collection, getDocs } = await import('firebase/firestore');

      const productsSnap = await getDocs(collection(db, 'products')).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'products')
      );
      if (productsSnap && !productsSnap.empty) {
        this.state.products = productsSnap.docs.map((d) => d.data() as Product);
      }

      const invSnap = await getDocs(collection(db, 'inventory_levels')).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'inventory_levels')
      );
      if (invSnap && !invSnap.empty) {
        this.state.inventory = invSnap.docs.map((d) => d.data() as InventoryLevel);
      }

      const ordersSnap = await getDocs(collection(db, 'orders')).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'orders')
      );
      if (ordersSnap && !ordersSnap.empty) {
        this.state.orders = ordersSnap.docs.map((d) => d.data() as Order);
      }

      const inputersSnap = await getDocs(collection(db, 'inputers')).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'inputers')
      );
      if (inputersSnap && !inputersSnap.empty) {
        this.state.inputers = inputersSnap.docs.map((d) => d.data() as Inputer);
      }

      const activitiesSnap = await getDocs(collection(db, 'inputer_activities')).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'inputer_activities')
      );
      if (activitiesSnap && !activitiesSnap.empty) {
        this.state.inputerActivities = activitiesSnap.docs.map((d) => d.data() as InputerActivity);
      }

      this.saveState();
      return {
        success: true,
        message: `Retrieved ${this.state.products.length} products, ${this.state.inputers.length} staff inputers, and ${(this.state.inputerActivities || []).length} activity logs from Firestore Cloud!`
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Failed to fetch from Firestore Cloud'
      };
    }
  }

  // --- Purchase Orders Workflow ---
  public getPurchaseOrders(): PurchaseOrder[] {
    return this.getState().purchaseOrders || [];
  }

  public createPurchaseOrder(
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'>
  ): PurchaseOrder {
    const id = `po_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id,
      status: 'ordered',
      createdAt: new Date().toISOString()
    };

    if (!this.state.purchaseOrders) {
      this.state.purchaseOrders = [];
    }
    this.state.purchaseOrders.unshift(newPO);

    this.logAudit({
      actorId: 'usr_admin',
      actorName: poData.createdBy || 'Inventory Director',
      role: 'Inventory Director',
      action: 'PO_CREATED',
      entityType: 'purchase_order',
      entityId: newPO.poNumber,
      details: `Created purchase order for ${newPO.items.length} items to ${newPO.supplierName} total $${newPO.totalCost.toFixed(2)}`
    });

    this.saveState();
    return newPO;
  }

  public receivePurchaseOrder(
    poId: string,
    receivedBy: string
  ): { success: boolean; message: string } {
    const po = this.state.purchaseOrders?.find((p) => p.id === poId);
    if (!po) return { success: false, message: 'Purchase order not found.' };
    if (po.status === 'received') return { success: false, message: 'PO already received.' };

    const timestamp = new Date().toISOString();
    po.status = 'received';
    po.receivedAt = timestamp;

    // Restock each item into the target location
    po.items.forEach((item) => {
      item.receivedQuantity = item.quantity;
      this.restockProduct(
        item.productId,
        po.destinationLocationId,
        item.quantity,
        `LOT-${po.poNumber}`,
        undefined,
        po.poNumber,
        `Inbound PO reception from ${po.supplierName}`,
        receivedBy
      );
    });

    this.logAudit({
      actorId: 'usr_admin',
      actorName: receivedBy,
      role: 'Warehouse Receiving Officer',
      action: 'PO_RECEIVED',
      entityType: 'purchase_order',
      entityId: po.poNumber,
      details: `Received & stocked ${po.items.reduce((s, i) => s + i.quantity, 0)} units into ${po.destinationLocationName}`
    });

    this.saveState();
    return { success: true, message: `Successfully received and restocked ${po.poNumber}!` };
  }

  public cancelPurchaseOrder(poId: string, reason = 'Cancelled by operator'): boolean {
    const po = this.state.purchaseOrders?.find((p) => p.id === poId);
    if (!po || po.status === 'received') return false;

    po.status = 'cancelled';
    this.logAudit({
      actorId: 'usr_admin',
      actorName: 'Inventory Officer',
      role: 'Inventory Officer',
      action: 'PO_CANCELLED',
      entityType: 'purchase_order',
      entityId: po.poNumber,
      details: `Cancelled purchase order: ${reason}`
    });

    this.saveState();
    return true;
  }

  // --- Order Returns & Partial Refunds ---
  public processOrderRefund(
    orderId: string,
    refundAmount: number,
    reason: string,
    restock: boolean,
    operator: string
  ): { success: boolean; message: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const timestamp = new Date().toISOString();
    order.refundAmount = (order.refundAmount || 0) + refundAmount;
    order.refundedAt = timestamp;
    order.refundReason = reason;
    order.refundRestocked = restock;
    order.paymentStatus = order.refundAmount >= order.grandTotal ? 'refunded' : 'partially_paid';

    // Restock items if requested
    if (restock && order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        this.restockProduct(
          item.productId,
          order.locationId,
          item.quantity,
          'RETURN-RESTOCK',
          undefined,
          `REF-${order.orderNumber}`,
          `Customer return restock: ${reason}`,
          operator
        );
      });
    }

    // If wholesale customer, credit back to outstanding balance
    if (order.customerId) {
      const cust = this.state.customers.find((c) => c.id === order.customerId);
      if (cust && cust.outstandingBalance > 0) {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - refundAmount);
      }
    }

    this.logAudit({
      actorId: 'usr_admin',
      actorName: operator,
      role: 'Senior Cashier / Supervisor',
      action: 'ORDER_REFUNDED',
      entityType: 'order',
      entityId: order.orderNumber,
      details: `Processed refund of $${refundAmount.toFixed(2)} (${order.paymentStatus}). Restocked: ${restock ? 'Yes' : 'No'}. Reason: ${reason}`
    });

    this.saveState();
    return { success: true, message: `Processed refund of $${refundAmount.toFixed(2)} successfully.` };
  }

  // --- Wholesale Payments / Partial Payments ---
  public recordOrderPayment(
    orderId: string,
    amount: number,
    paymentMethod: any,
    reference?: string
  ): { success: boolean; message: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const currentPaid = order.paidAmount || (order.paymentStatus === 'paid' ? order.grandTotal : 0);
    const newPaid = currentPaid + amount;
    order.paidAmount = newPaid;

    if (newPaid >= order.grandTotal) {
      order.paymentStatus = 'paid';
    } else {
      order.paymentStatus = 'partially_paid';
    }

    // Reduce customer outstanding balance
    if (order.customerId) {
      const cust = this.state.customers.find((c) => c.id === order.customerId);
      if (cust) {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - amount);
      }
    }

    // If bank transfer or wire, register in BankTransactions
    if (paymentMethod === 'bank_transfer' || paymentMethod === 'wire_transfer') {
      const defaultBank = this.state.linkedBankAccounts?.[0];
      const bankTxRef = reference || `PAY-${Date.now().toString().slice(-6)}`;
      this.state.bankTransactions.unshift({
        id: `btx_${Date.now()}`,
        bankAccountId: defaultBank ? defaultBank.id : 'bnk_default',
        bankName: defaultBank ? defaultBank.bankName : 'Merchant Bank',
        orderId: order.id,
        orderNumber: order.orderNumber,
        referenceCode: bankTxRef,
        type: 'wholesale_settlement',
        amount,
        currency: 'USD',
        senderName: order.customerCompany || order.customerName,
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'manual_admin',
        description: `Settlement payment for ${order.orderNumber}`,
        createdAt: new Date().toISOString()
      });
      if (defaultBank) {
        defaultBank.balance += amount;
      }
    }

    this.logAudit({
      actorId: 'usr_admin',
      actorName: 'Accounts Receivable',
      role: 'Accounting',
      action: 'PAYMENT_RECORDED',
      entityType: 'order',
      entityId: order.orderNumber,
      details: `Recorded payment of $${amount.toFixed(2)} via ${paymentMethod}. Total paid: $${newPaid.toFixed(2)} / $${order.grandTotal.toFixed(2)}`
    });

    this.saveState();
    return { success: true, message: `Recorded payment of $${amount.toFixed(2)}.` };
  }

  // --- Audit Logging ---
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    if (!this.state.auditLogs) {
      this.state.auditLogs = [];
    }
    const logItem: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.state.auditLogs.unshift(logItem);
    // Keep max 200 audit entries in local storage
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
    this.saveState();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.getState().auditLogs || [];
  }

  // --- System Backup & Restore ---
  public exportDatabaseBackup(): string {
    return JSON.stringify(
      {
        version: '4.02',
        exportedAt: new Date().toISOString(),
        data: this.getState()
      },
      null,
      2
    );
  }

  public importDatabaseBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (!data.products || !data.inventory || !data.orders || !data.locations) {
        return { success: false, message: 'Invalid backup file schema: missing core tables.' };
      }

      this.state = {
        locations: data.locations,
        products: data.products,
        priceTiers: data.priceTiers || [...INITIAL_PRICE_TIERS],
        inventory: data.inventory,
        customers: data.customers || [...INITIAL_CUSTOMERS],
        orders: data.orders,
        stockMovements: data.stockMovements || [...INITIAL_STOCK_MOVEMENTS],
        shifts: data.shifts || [...INITIAL_SHIFTS],
        inputers: data.inputers || [...INITIAL_INPUTERS],
        inputerActivities: data.inputerActivities || [...INITIAL_INPUTER_ACTIVITIES],
        linkedBankAccounts: data.linkedBankAccounts || [...INITIAL_LINKED_BANKS],
        bankTransactions: data.bankTransactions || [...INITIAL_BANK_TRANSACTIONS],
        purchaseOrders: data.purchaseOrders || [...INITIAL_PURCHASE_ORDERS],
        auditLogs: data.auditLogs || [...INITIAL_AUDIT_LOGS],
        customCategories: data.customCategories || []
      };

      this.logAudit({
        actorId: 'usr_admin',
        actorName: 'Admin System',
        role: 'Administrator',
        action: 'DATABASE_RESTORED',
        entityType: 'auth',
        entityId: 'backup_import',
        details: `Restored database backup containing ${this.state.products.length} products and ${this.state.orders.length} orders`
      });

      this.saveState();
      return { success: true, message: 'Database successfully restored from backup file.' };
    } catch (e: any) {
      return { success: false, message: `Failed to parse backup: ${e.message}` };
    }
  }
}

export const dbStore = new DatabaseStore();
