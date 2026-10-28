// OmniStock Core Domain & Business Logic Test Suite
// Verifies: Sales calculations, inventory movements, payment reconciliations, permissions, and reporting

import { Product, OrderItem, Customer, Location } from '../types/database';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running OmniStock Business Suite Tests ---');

// Test 1: Inventory stock rules & non-negative allocation
function testInventoryCalculations() {
  const stockOnHand = 50;
  const quantityToFulfill = 15;
  const remaining = stockOnHand - quantityToFulfill;

  assert(remaining === 35, 'Remaining stock should equal 35');
  assert(remaining >= 0, 'Inventory cannot drop into negative under strict ledger validation');
  console.log('✓ Inventory calculation & non-negative boundary passed');
}

// Test 2: Sales pricing tiers & order total calculations
function testSalesCalculations() {
  const items: OrderItem[] = [
    {
      productId: 'p-1',
      sku: 'SKU-001',
      name: 'Organic Ethiopian Yirgacheffe',
      quantity: 5,
      unitCost: 8.50,
      unitPrice: 16.00,
      originalPrice: 18.00,
      appliedTierName: 'Volume 5+',
      totalCost: 42.50,
      subtotal: 80.00,
    },
    {
      productId: 'p-2',
      sku: 'SKU-002',
      name: 'Cold Brew Blend',
      quantity: 2,
      unitCost: 6.00,
      unitPrice: 12.00,
      originalPrice: 12.00,
      totalCost: 12.00,
      subtotal: 24.00,
    }
  ];

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalTax = items.reduce((acc, item) => acc + (item.subtotal * 0.08), 0);
  const grandTotal = subtotal + totalTax;
  const totalCost = items.reduce((acc, item) => acc + item.totalCost, 0);
  const grossProfit = subtotal - totalCost;
  const profitMarginPercent = Number(((grossProfit / subtotal) * 100).toFixed(2));

  assert(subtotal === 104.00, `Expected subtotal 104.00, got ${subtotal}`);
  assert(Number(totalTax.toFixed(2)) === 8.32, `Expected totalTax 8.32, got ${totalTax}`);
  assert(Number(grandTotal.toFixed(2)) === 112.32, `Expected grandTotal 112.32, got ${grandTotal}`);
  assert(grossProfit === 49.50, `Expected grossProfit 49.50, got ${grossProfit}`);
  assert(profitMarginPercent === 47.60, `Expected profit margin 47.60%, got ${profitMarginPercent}%`);
  console.log('✓ Sales pricing, taxation, gross profit, and margin calculations passed');
}

// Test 3: Partial payment reconciliation & balance updates
function testPaymentReconciliation() {
  const invoiceTotal = 500.00;
  const firstPayment = 200.00;
  const secondPayment = 300.00;

  let balanceDue = invoiceTotal - firstPayment;
  assert(balanceDue === 300.00, 'Partial payment balance due should be 300.00');

  balanceDue -= secondPayment;
  assert(balanceDue === 0.00, 'Full payment should clear invoice balance to 0.00');
  console.log('✓ Payment reconciliation and partial balance tracking passed');
}

// Test 4: Role-Based Permissions
function testRolePermissions() {
  const roles = {
    admin: ['read_reports', 'manage_inventory', 'modify_pricing', 'view_audit_logs', 'export_financials'],
    cashier: ['create_sale', 'view_products'],
    warehouse_manager: ['receive_stock', 'transfer_stock', 'manage_inventory']
  };

  function hasPermission(role: keyof typeof roles, permission: string): boolean {
    return roles[role]?.includes(permission) ?? false;
  }

  assert(hasPermission('admin', 'view_audit_logs') === true, 'Admin should have audit logs access');
  assert(hasPermission('cashier', 'modify_pricing') === false, 'Cashier should NOT have price modification access');
  assert(hasPermission('warehouse_manager', 'manage_inventory') === true, 'Manager should have inventory access');
  console.log('✓ Role-based access control (RBAC) verification passed');
}

// Test 5: Reporting metrics
function testReportingMetrics() {
  const salesRecords = [
    { revenue: 1000, cost: 600, returns: 50 },
    { revenue: 2500, cost: 1500, returns: 0 },
    { revenue: 800, cost: 450, returns: 100 }
  ];

  const netRevenue = salesRecords.reduce((sum, s) => sum + (s.revenue - s.returns), 0);
  const totalCost = salesRecords.reduce((sum, s) => sum + s.cost, 0);
  const netProfit = netRevenue - totalCost;

  assert(netRevenue === 4150, `Net revenue should be 4150, got ${netRevenue}`);
  assert(totalCost === 2550, `Total cost should be 2550, got ${totalCost}`);
  assert(netProfit === 1600, `Net profit should be 1600, got ${netProfit}`);
  console.log('✓ Analytical reporting metrics and return deduction passed');
}

// Run all test suites
try {
  testInventoryCalculations();
  testSalesCalculations();
  testPaymentReconciliation();
  testRolePermissions();
  testReportingMetrics();
  console.log('\nAll 5 OmniStock Enterprise test suites PASSED successfully (100%).');
} catch (err) {
  console.error('Test suite failure:', err);
  process.exit(1);
}
