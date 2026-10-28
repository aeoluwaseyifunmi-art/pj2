import {
  Location,
  Product,
  PriceTier,
  InventoryLevel,
  Customer,
  Order,
  StockMovement,
  RegisterShift,
  Inputer,
  InputerActivity,
  LinkedBankAccount,
  BankTransaction,
  PurchaseOrder,
  AuditLogEntry
} from '../types/database';

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: 'loc_wh_central',
    name: 'Central Distribution Center',
    code: 'CDC-01',
    type: 'warehouse',
    address: '8400 Logistics Blvd, Dock 14, Chicago, IL',
    isPrimary: true
  },
  {
    id: 'loc_store_flagship',
    name: 'Downtown Flagship Store',
    code: 'RET-01',
    type: 'retail_store',
    address: '420 Michigan Avenue, Suite 100, Chicago, IL',
    isPrimary: false
  },
  {
    id: 'loc_store_northside',
    name: 'Northside Commercial Outlet',
    code: 'RET-02',
    type: 'retail_store',
    address: '1850 N Clark St, Chicago, IL',
    isPrimary: false
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_coffee_ethiopia',
    sku: 'COF-ETH-YRG',
    barcode: '891024500112',
    name: 'Arcadia Yirgacheffe Single Origin',
    category: 'Gourmet Provisions',
    description: 'Specialty grade whole bean coffee, washed process with notes of bergamot and blueberry. Packaged in nitrogen-flushed 1kg bags or 30kg wholesale burlap sacks.',
    unit: '1kg Bag',
    costPrice: 9.80,
    retailPrice: 24.50,
    wholesaleBasePrice: 16.50,
    minWholesaleQty: 10,
    imageUrl: '/src/assets/images/retail_coffee_beans_1793014154529.jpg',
    taxRate: 0.0825,
    reorderThreshold: 45,
    targetStockLevel: 250
  },
  {
    id: 'prod_olive_oil_evoo',
    sku: 'OIL-ITA-750',
    barcode: '891024500229',
    name: 'Tuscan Reserve Extra Virgin Olive Oil',
    category: 'Gourmet Provisions',
    description: 'Cold-pressed first harvest single-estate extra virgin olive oil. 750ml UV-protected glass bottles. Sold individually or in 6-bottle master cartons.',
    unit: '750ml Bottle',
    costPrice: 14.20,
    retailPrice: 36.00,
    wholesaleBasePrice: 23.50,
    minWholesaleQty: 12,
    imageUrl: '/src/assets/images/retail_organic_olive_oil_1793014155756.jpg',
    taxRate: 0.0825,
    reorderThreshold: 30,
    targetStockLevel: 180
  },
  {
    id: 'prod_mech_keyboard',
    sku: 'KEY-ERG-87B',
    barcode: '891024500336',
    name: 'Vertex Apex Ergonomic Mechanical Keyboard',
    category: 'Hardware & Tech',
    description: 'Precision CNC aluminum chassis with hot-swappable tactile switches, sound-dampening brass plate, and PBT double-shot keycaps.',
    unit: 'Unit',
    costPrice: 62.00,
    retailPrice: 159.00,
    wholesaleBasePrice: 105.00,
    minWholesaleQty: 5,
    imageUrl: '/src/assets/images/retail_mechanical_keyboard_1793014156131.jpg',
    taxRate: 0.0825,
    reorderThreshold: 15,
    targetStockLevel: 90
  },
  {
    id: 'prod_anc_headphones',
    sku: 'AUD-AUR-NC1',
    barcode: '891024500443',
    name: 'Aurora Sound Pro Studio ANC Headphones',
    category: 'Hardware & Tech',
    description: 'Reference acoustic profile, hybrid active noise cancellation, low-latency lossless wireless codec, 45-hour battery life.',
    unit: 'Unit',
    costPrice: 85.00,
    retailPrice: 220.00,
    wholesaleBasePrice: 145.00,
    minWholesaleQty: 5,
    imageUrl: '',
    taxRate: 0.0825,
    reorderThreshold: 20,
    targetStockLevel: 100
  },
  {
    id: 'prod_matcha_ceremonial',
    sku: 'TEA-MTC-UJI',
    barcode: '891024500550',
    name: 'Uji Ceremonial Grade Stoneground Matcha',
    category: 'Gourmet Provisions',
    description: 'First flush organic tencha green tea stoneground in Kyoto. Vibrant emerald liquor with deep umami sweetness. 100g tins.',
    unit: '100g Tin',
    costPrice: 12.50,
    retailPrice: 32.00,
    wholesaleBasePrice: 19.80,
    minWholesaleQty: 15,
    imageUrl: '',
    taxRate: 0.0825,
    reorderThreshold: 25,
    targetStockLevel: 140
  },
  {
    id: 'prod_usb_dock_hub',
    sku: 'HUB-TB4-12P',
    barcode: '891024500667',
    name: 'Thunderbolt 4 Pro Quad-Display Dock',
    category: 'Hardware & Tech',
    description: '12-in-1 enterprise workstation dock, 100W Power Delivery, dual 4K/single 8K output, 2.5GbE Ethernet and SD Express card slot.',
    unit: 'Unit',
    costPrice: 78.00,
    retailPrice: 189.00,
    wholesaleBasePrice: 122.00,
    minWholesaleQty: 6,
    imageUrl: '',
    taxRate: 0.0825,
    reorderThreshold: 12,
    targetStockLevel: 60
  },
  {
    id: 'prod_craft_cider_crate',
    sku: 'BEV-CID-CR24',
    barcode: '891024500774',
    name: 'Heirloom Orchard Dry Apple Cider (Case 24x)',
    category: 'Beverages & Dry Goods',
    description: 'Batch-fermented wild yeast crisp cider in 330ml bottles. Commercial wholesale case of 24 units.',
    unit: 'Case (24x)',
    costPrice: 26.00,
    retailPrice: 68.00,
    wholesaleBasePrice: 44.00,
    minWholesaleQty: 4,
    imageUrl: '',
    taxRate: 0.0825,
    reorderThreshold: 18,
    targetStockLevel: 80
  },
  {
    id: 'prod_kraft_packaging',
    sku: 'PKG-BOX-M100',
    barcode: '891024500881',
    name: 'Corrugated Eco-Kraft Mailer Boxes (Pack 100)',
    category: 'Industrial Supplies',
    description: 'Double-walled recycled kraft shipping cartons, quick self-seal adhesive strip. Standard 12x9x4 inch form factor.',
    unit: 'Bundle (100x)',
    costPrice: 22.00,
    retailPrice: 54.00,
    wholesaleBasePrice: 35.00,
    minWholesaleQty: 5,
    imageUrl: '',
    taxRate: 0.0825,
    reorderThreshold: 20,
    targetStockLevel: 120
  }
];

export const INITIAL_PRICE_TIERS: PriceTier[] = [
  // Coffee Tiers
  { id: 'tier_cof_1', productId: 'prod_coffee_ethiopia', minQuantity: 10, tierLabel: 'Wholesale Tier 1 (10-49)', unitPrice: 16.50, discountPercent: 32.6 },
  { id: 'tier_cof_2', productId: 'prod_coffee_ethiopia', minQuantity: 50, tierLabel: 'Wholesale Tier 2 (50-199)', unitPrice: 14.20, discountPercent: 42.0 },
  { id: 'tier_cof_3', productId: 'prod_coffee_ethiopia', minQuantity: 200, tierLabel: 'Master Roaster Bulk (200+)', unitPrice: 12.00, discountPercent: 51.0 },

  // Olive Oil Tiers
  { id: 'tier_oil_1', productId: 'prod_olive_oil_evoo', minQuantity: 12, tierLabel: 'Wholesale Tier 1 (12-59)', unitPrice: 23.50, discountPercent: 34.7 },
  { id: 'tier_oil_2', productId: 'prod_olive_oil_evoo', minQuantity: 60, tierLabel: 'Hospitality Master Case (60+)', unitPrice: 20.00, discountPercent: 44.4 },

  // Mechanical Keyboard Tiers
  { id: 'tier_key_1', productId: 'prod_mech_keyboard', minQuantity: 5, tierLabel: 'B2B Office Tier (5-19)', unitPrice: 105.00, discountPercent: 33.9 },
  { id: 'tier_key_2', productId: 'prod_mech_keyboard', minQuantity: 20, tierLabel: 'Enterprise Fleet (20+)', unitPrice: 92.00, discountPercent: 42.1 },

  // Headphones Tiers
  { id: 'tier_aud_1', productId: 'prod_anc_headphones', minQuantity: 5, tierLabel: 'Reseller Standard (5-19)', unitPrice: 145.00, discountPercent: 34.1 },
  { id: 'tier_aud_2', productId: 'prod_anc_headphones', minQuantity: 20, tierLabel: 'Commercial Volume (20+)', unitPrice: 128.00, discountPercent: 41.8 },

  // Matcha Tiers
  { id: 'tier_tea_1', productId: 'prod_matcha_ceremonial', minQuantity: 15, tierLabel: 'Cafe Wholesale (15-49)', unitPrice: 19.80, discountPercent: 38.1 },
  { id: 'tier_tea_2', productId: 'prod_matcha_ceremonial', minQuantity: 50, tierLabel: 'Chain Volume (50+)', unitPrice: 16.50, discountPercent: 48.4 },

  // Thunderbolt Hub Tiers
  { id: 'tier_hub_1', productId: 'prod_usb_dock_hub', minQuantity: 6, tierLabel: 'IT Distributor (6-24)', unitPrice: 122.00, discountPercent: 35.4 },
  { id: 'tier_hub_2', productId: 'prod_usb_dock_hub', minQuantity: 25, tierLabel: 'Corporate Procurement (25+)', unitPrice: 108.00, discountPercent: 42.8 }
];

export const INITIAL_INVENTORY: InventoryLevel[] = [
  // Arcadia Coffee
  { id: 'inv_1', productId: 'prod_coffee_ethiopia', locationId: 'loc_wh_central', quantityOnHand: 240, quantityReserved: 40, batchLot: 'LOT-2026-CF08', expiryDate: '2027-08-15', binLocation: 'Bay 4, Rack C-2', updatedAt: '2026-10-25T14:20:00Z' },
  { id: 'inv_2', productId: 'prod_coffee_ethiopia', locationId: 'loc_store_flagship', quantityOnHand: 34, quantityReserved: 0, batchLot: 'LOT-2026-CF08', expiryDate: '2027-08-15', binLocation: 'Shelf 1-B', updatedAt: '2026-10-25T11:00:00Z' },
  { id: 'inv_3', productId: 'prod_coffee_ethiopia', locationId: 'loc_store_northside', quantityOnHand: 18, quantityReserved: 0, batchLot: 'LOT-2026-CF06', expiryDate: '2027-06-30', binLocation: 'Display Front', updatedAt: '2026-10-24T18:30:00Z' },

  // Olive Oil
  { id: 'inv_4', productId: 'prod_olive_oil_evoo', locationId: 'loc_wh_central', quantityOnHand: 180, quantityReserved: 24, batchLot: 'LOT-2026-EV21', expiryDate: '2028-02-28', binLocation: 'Bay 2, Rack A-1', updatedAt: '2026-10-24T09:15:00Z' },
  { id: 'inv_5', productId: 'prod_olive_oil_evoo', locationId: 'loc_store_flagship', quantityOnHand: 22, quantityReserved: 0, batchLot: 'LOT-2026-EV21', expiryDate: '2028-02-28', binLocation: 'Aisle 3 Gourmet', updatedAt: '2026-10-25T16:00:00Z' },
  { id: 'inv_6', productId: 'prod_olive_oil_evoo', locationId: 'loc_store_northside', quantityOnHand: 8, quantityReserved: 0, batchLot: 'LOT-2026-EV19', expiryDate: '2028-01-15', binLocation: 'Aisle 1 Endcap', updatedAt: '2026-10-25T12:00:00Z' },

  // Keyboards
  { id: 'inv_7', productId: 'prod_mech_keyboard', locationId: 'loc_wh_central', quantityOnHand: 74, quantityReserved: 10, batchLot: 'LOT-VK-994', expiryDate: undefined, binLocation: 'Secured Bay 8', updatedAt: '2026-10-23T15:00:00Z' },
  { id: 'inv_8', productId: 'prod_mech_keyboard', locationId: 'loc_store_flagship', quantityOnHand: 12, quantityReserved: 0, batchLot: 'LOT-VK-994', expiryDate: undefined, binLocation: 'Tech Showcase 1', updatedAt: '2026-10-25T17:45:00Z' },
  { id: 'inv_9', productId: 'prod_mech_keyboard', locationId: 'loc_store_northside', quantityOnHand: 6, quantityReserved: 0, batchLot: 'LOT-VK-994', expiryDate: undefined, binLocation: 'Hardware Display', updatedAt: '2026-10-24T10:10:00Z' },

  // Headphones
  { id: 'inv_10', productId: 'prod_anc_headphones', locationId: 'loc_wh_central', quantityOnHand: 65, quantityReserved: 15, batchLot: 'LOT-AR-883', expiryDate: undefined, binLocation: 'Secured Bay 8', updatedAt: '2026-10-25T08:20:00Z' },
  { id: 'inv_11', productId: 'prod_anc_headphones', locationId: 'loc_store_flagship', quantityOnHand: 9, quantityReserved: 0, batchLot: 'LOT-AR-883', expiryDate: undefined, binLocation: 'Audio Wall Demo', updatedAt: '2026-10-25T18:00:00Z' },
  { id: 'inv_12', productId: 'prod_anc_headphones', locationId: 'loc_store_northside', quantityOnHand: 4, quantityReserved: 0, batchLot: 'LOT-AR-883', expiryDate: undefined, binLocation: 'Audio Case', updatedAt: '2026-10-24T14:40:00Z' },

  // Matcha
  { id: 'inv_13', productId: 'prod_matcha_ceremonial', locationId: 'loc_wh_central', quantityOnHand: 130, quantityReserved: 30, batchLot: 'LOT-MTC-04', expiryDate: '2027-11-20', binLocation: 'Climate Room B', updatedAt: '2026-10-25T13:10:00Z' },
  { id: 'inv_14', productId: 'prod_matcha_ceremonial', locationId: 'loc_store_flagship', quantityOnHand: 16, quantityReserved: 0, batchLot: 'LOT-MTC-04', expiryDate: '2027-11-20', binLocation: 'Tea Shelf Top', updatedAt: '2026-10-25T16:20:00Z' },
  { id: 'inv_15', productId: 'prod_matcha_ceremonial', locationId: 'loc_store_northside', quantityOnHand: 11, quantityReserved: 0, batchLot: 'LOT-MTC-04', expiryDate: '2027-11-20', binLocation: 'Specialty Case', updatedAt: '2026-10-25T09:30:00Z' },

  // Thunderbolt Hub
  { id: 'inv_16', productId: 'prod_usb_dock_hub', locationId: 'loc_wh_central', quantityOnHand: 48, quantityReserved: 12, batchLot: 'LOT-TB-310', expiryDate: undefined, binLocation: 'Bay 6, Rack B-1', updatedAt: '2026-10-23T11:40:00Z' },
  { id: 'inv_17', productId: 'prod_usb_dock_hub', locationId: 'loc_store_flagship', quantityOnHand: 7, quantityReserved: 0, batchLot: 'LOT-TB-310', expiryDate: undefined, binLocation: 'Workstation Rack', updatedAt: '2026-10-25T15:00:00Z' },
  { id: 'inv_18', productId: 'prod_usb_dock_hub', locationId: 'loc_store_northside', quantityOnHand: 3, quantityReserved: 0, batchLot: 'LOT-TB-310', expiryDate: undefined, binLocation: 'IT Solutions', updatedAt: '2026-10-24T11:15:00Z' },

  // Cider
  { id: 'inv_19', productId: 'prod_craft_cider_crate', locationId: 'loc_wh_central', quantityOnHand: 68, quantityReserved: 16, batchLot: 'LOT-CID-88', expiryDate: '2027-05-30', binLocation: 'Cold Bay 1', updatedAt: '2026-10-25T10:15:00Z' },
  { id: 'inv_20', productId: 'prod_craft_cider_crate', locationId: 'loc_store_flagship', quantityOnHand: 14, quantityReserved: 0, batchLot: 'LOT-CID-88', expiryDate: '2027-05-30', binLocation: 'Beverage Pallet', updatedAt: '2026-10-25T17:10:00Z' },

  // Kraft Boxes
  { id: 'inv_21', productId: 'prod_kraft_packaging', locationId: 'loc_wh_central', quantityOnHand: 110, quantityReserved: 20, batchLot: 'LOT-BX-102', expiryDate: undefined, binLocation: 'Pallet Zone D', updatedAt: '2026-10-22T14:00:00Z' },
  { id: 'inv_22', productId: 'prod_kraft_packaging', locationId: 'loc_store_flagship', quantityOnHand: 15, quantityReserved: 0, batchLot: 'LOT-BX-102', expiryDate: undefined, binLocation: 'Shipping Backroom', updatedAt: '2026-10-25T14:30:00Z' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_walkin_retail',
    name: 'Walk-in Retail Customer',
    type: 'retail_walkin',
    resaleCertVerified: false,
    email: 'counter@store.local',
    phone: 'N/A',
    paymentTerms: 'immediate',
    creditLimit: 0,
    outstandingBalance: 0
  },
  {
    id: 'cust_ws_pacific_cafe',
    name: 'Marcus Vance',
    companyName: 'Pacific Rim Specialty Roasters',
    type: 'wholesale_business',
    taxId: 'US-EIN-36491820',
    resaleCertVerified: true,
    email: 'purchasing@pacificroasters.com',
    phone: '(312) 555-8831',
    paymentTerms: 'net30',
    creditLimit: 15000.00,
    outstandingBalance: 3420.50,
    discountTier: 'Wholesale Tier 2'
  },
  {
    id: 'cust_ws_metro_tech',
    name: 'Elena Rostova',
    companyName: 'Metro Enterprise Tech Solutions',
    type: 'wholesale_business',
    taxId: 'US-EIN-88203914',
    resaleCertVerified: true,
    email: 'accounts@metrotechcorp.io',
    phone: '(312) 555-4290',
    paymentTerms: 'net30',
    creditLimit: 30000.00,
    outstandingBalance: 8650.00,
    discountTier: 'Corporate Fleet Tier'
  },
  {
    id: 'cust_ws_granary_table',
    name: 'Chef Dominic Rossi',
    companyName: 'The Granary Table Bistro Group',
    type: 'wholesale_business',
    taxId: 'US-EIN-51928374',
    resaleCertVerified: true,
    email: 'culinary@granarytable.com',
    phone: '(312) 555-7162',
    paymentTerms: 'net15',
    creditLimit: 10000.00,
    outstandingBalance: 1240.00,
    discountTier: 'Hospitality Partner'
  },
  {
    id: 'cust_vip_sarah',
    name: 'Sarah Chen (VIP Member)',
    type: 'vip_retail',
    resaleCertVerified: false,
    email: 'sarah.chen@gmail.com',
    phone: '(312) 555-1944',
    paymentTerms: 'immediate',
    creditLimit: 1000.00,
    outstandingBalance: 0,
    discountTier: 'Store VIP 10%'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'POS-2026-8910',
    channel: 'retail',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    customerId: 'cust_walkin_retail',
    customerName: 'Walk-in Retail Customer',
    items: [
      {
        productId: 'prod_coffee_ethiopia',
        sku: 'COF-ETH-YRG',
        name: 'Arcadia Yirgacheffe Single Origin',
        quantity: 2,
        unitCost: 9.80,
        unitPrice: 24.50,
        originalPrice: 24.50,
        subtotal: 49.00,
        totalCost: 19.60
      },
      {
        productId: 'prod_olive_oil_evoo',
        sku: 'OIL-ITA-750',
        name: 'Tuscan Reserve Extra Virgin Olive Oil',
        quantity: 1,
        unitCost: 14.20,
        unitPrice: 36.00,
        originalPrice: 36.00,
        subtotal: 36.00,
        totalCost: 14.20
      }
    ],
    subtotal: 85.00,
    discountTotal: 0.00,
    taxTotal: 7.01,
    grandTotal: 92.01,
    costTotal: 33.80,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    cashier: 'Alexander Wright',
    notes: 'Walk-in counter sale, receipt #8910',
    createdAt: '2026-10-25T14:15:20Z'
  },
  {
    id: 'ord_102',
    orderNumber: 'INV-WS-4401',
    channel: 'wholesale',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    customerId: 'cust_ws_pacific_cafe',
    customerName: 'Marcus Vance',
    customerCompany: 'Pacific Rim Specialty Roasters',
    customerTaxId: 'US-EIN-36491820',
    items: [
      {
        productId: 'prod_coffee_ethiopia',
        sku: 'COF-ETH-YRG',
        name: 'Arcadia Yirgacheffe Single Origin',
        quantity: 50,
        unitCost: 9.80,
        unitPrice: 14.20,
        originalPrice: 24.50,
        appliedTierName: 'Wholesale Tier 2 (50-199)',
        subtotal: 710.00,
        totalCost: 490.00
      },
      {
        productId: 'prod_matcha_ceremonial',
        sku: 'TEA-MTC-UJI',
        name: 'Uji Ceremonial Grade Stoneground Matcha',
        quantity: 20,
        unitCost: 12.50,
        unitPrice: 19.80,
        originalPrice: 32.00,
        appliedTierName: 'Cafe Wholesale (15-49)',
        subtotal: 396.00,
        totalCost: 250.00
      }
    ],
    subtotal: 1106.00,
    discountTotal: 0.00,
    taxTotal: 0.00, // Tax exempt verified B2B
    grandTotal: 1106.00,
    costTotal: 740.00,
    paymentMethod: 'net_terms_invoice',
    paymentStatus: 'pending_net30',
    cashier: 'B2B Wholesale Desk',
    notes: 'Fulfill via Dock 14, Net 30 Terms. Resale Cert verified.',
    createdAt: '2026-10-25T11:30:00Z'
  },
  {
    id: 'ord_103',
    orderNumber: 'INV-WS-4402',
    channel: 'wholesale',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    customerId: 'cust_ws_metro_tech',
    customerName: 'Elena Rostova',
    customerCompany: 'Metro Enterprise Tech Solutions',
    customerTaxId: 'US-EIN-88203914',
    items: [
      {
        productId: 'prod_mech_keyboard',
        sku: 'KEY-ERG-87B',
        name: 'Vertex Apex Ergonomic Mechanical Keyboard',
        quantity: 20,
        unitCost: 62.00,
        unitPrice: 92.00,
        originalPrice: 159.00,
        appliedTierName: 'Enterprise Fleet (20+)',
        subtotal: 1840.00,
        totalCost: 1240.00
      },
      {
        productId: 'prod_usb_dock_hub',
        sku: 'HUB-TB4-12P',
        name: 'Thunderbolt 4 Pro Quad-Display Dock',
        quantity: 10,
        unitCost: 78.00,
        unitPrice: 122.00,
        originalPrice: 189.00,
        appliedTierName: 'IT Distributor (6-24)',
        subtotal: 1220.00,
        totalCost: 780.00
      }
    ],
    subtotal: 3060.00,
    discountTotal: 0.00,
    taxTotal: 0.00,
    grandTotal: 3060.00,
    costTotal: 2020.00,
    paymentMethod: 'wire_transfer',
    paymentStatus: 'paid',
    cashier: 'B2B Wholesale Desk',
    notes: 'Corporate office tech refresh rollout batch 1',
    createdAt: '2026-10-24T16:00:00Z'
  },
  {
    id: 'ord_104',
    orderNumber: 'POS-2026-8911',
    channel: 'retail',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    customerId: 'cust_vip_sarah',
    customerName: 'Sarah Chen (VIP Member)',
    items: [
      {
        productId: 'prod_anc_headphones',
        sku: 'AUD-AUR-NC1',
        name: 'Aurora Sound Pro Studio ANC Headphones',
        quantity: 1,
        unitCost: 85.00,
        unitPrice: 198.00, // VIP 10% discount applied
        originalPrice: 220.00,
        subtotal: 198.00,
        totalCost: 85.00
      }
    ],
    subtotal: 198.00,
    discountTotal: 22.00,
    taxTotal: 16.34,
    grandTotal: 214.34,
    costTotal: 85.00,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    cashier: 'Alexander Wright',
    notes: 'Customer used VIP member loyalty perk',
    createdAt: '2026-10-25T16:45:10Z'
  },
  {
    id: 'ord_105',
    orderNumber: 'POS-2026-8912',
    channel: 'retail',
    locationId: 'loc_store_northside',
    locationName: 'Northside Commercial Outlet',
    customerId: 'cust_walkin_retail',
    customerName: 'Walk-in Retail Customer',
    items: [
      {
        productId: 'prod_craft_cider_crate',
        sku: 'BEV-CID-CR24',
        name: 'Heirloom Orchard Dry Apple Cider (Case 24x)',
        quantity: 1,
        unitCost: 26.00,
        unitPrice: 68.00,
        originalPrice: 68.00,
        subtotal: 68.00,
        totalCost: 26.00
      }
    ],
    subtotal: 68.00,
    discountTotal: 0.00,
    taxTotal: 5.61,
    grandTotal: 73.61,
    costTotal: 26.00,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    cashTendered: 80.00,
    cashChange: 6.39,
    cashier: 'Jordan Miller',
    notes: 'Walk-in customer, cash register 1',
    createdAt: '2026-10-25T17:15:00Z'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm_01',
    timestamp: '2026-10-25T14:15:20Z',
    productId: 'prod_coffee_ethiopia',
    locationId: 'loc_store_flagship',
    type: 'sale',
    quantityChange: -2,
    previousQty: 36,
    newQty: 34,
    referenceNumber: 'POS-2026-8910',
    reason: 'POS Counter Sale',
    operator: 'Alexander Wright'
  },
  {
    id: 'sm_02',
    timestamp: '2026-10-25T14:15:20Z',
    productId: 'prod_olive_oil_evoo',
    locationId: 'loc_store_flagship',
    type: 'sale',
    quantityChange: -1,
    previousQty: 23,
    newQty: 22,
    referenceNumber: 'POS-2026-8910',
    reason: 'POS Counter Sale',
    operator: 'Alexander Wright'
  },
  {
    id: 'sm_03',
    timestamp: '2026-10-25T11:30:00Z',
    productId: 'prod_coffee_ethiopia',
    locationId: 'loc_wh_central',
    type: 'wholesale_fulfillment',
    quantityChange: -50,
    previousQty: 290,
    newQty: 240,
    referenceNumber: 'INV-WS-4401',
    reason: 'B2B Wholesale Dispatch to Pacific Rim Roasters',
    operator: 'Dock 14 Dispatch'
  },
  {
    id: 'sm_04',
    timestamp: '2026-10-24T10:00:00Z',
    productId: 'prod_coffee_ethiopia',
    locationId: 'loc_wh_central',
    type: 'purchase_restock',
    quantityChange: 150,
    previousQty: 140,
    newQty: 290,
    referenceNumber: 'PO-2026-0941',
    reason: 'Received Inbound Container direct from Ethiopia Cooperatives',
    operator: 'Inventory Control'
  },
  {
    id: 'sm_05',
    timestamp: '2026-10-24T14:00:00Z',
    productId: 'prod_mech_keyboard',
    locationId: 'loc_store_flagship',
    type: 'transfer_in',
    quantityChange: 8,
    previousQty: 4,
    newQty: 12,
    referenceNumber: 'TRF-WH-RET-08',
    reason: 'Inter-branch stock transfer replenishment from CDC',
    operator: 'Store Manager'
  }
];

export const INITIAL_SHIFTS: RegisterShift[] = [
  {
    id: 'shift_today_flagship',
    registerId: 'REG-FLG-01',
    locationId: 'loc_store_flagship',
    cashier: 'Alexander Wright',
    openingFloat: 250.00,
    openedAt: '2026-10-25T08:00:00Z',
    cashCollected: 165.00,
    cardCollected: 1245.50,
    expectedCash: 415.00,
    status: 'open'
  },
  {
    id: 'shift_today_northside',
    registerId: 'REG-NOR-01',
    locationId: 'loc_store_northside',
    cashier: 'Jordan Miller',
    openingFloat: 200.00,
    openedAt: '2026-10-25T09:00:00Z',
    cashCollected: 73.61,
    cardCollected: 410.20,
    expectedCash: 273.61,
    status: 'open'
  }
];

export const INITIAL_INPUTERS: Inputer[] = [
  {
    id: 'inp_alexander_wright',
    staffCode: 'INP-01',
    name: 'Alexander Wright',
    email: 'alex.wright@omnistock.internal',
    phone: '+1 (555) 234-8901',
    pin: '1234',
    role: 'senior_cashier',
    assignedLocationId: 'loc_store_flagship',
    status: 'active',
    receiptsPrintedCount: 42,
    totalSalesVolume: 7420.50,
    createdAt: '2026-08-01T08:00:00Z',
    lastActiveAt: '2026-10-25T17:45:00Z'
  },
  {
    id: 'inp_jordan_miller',
    staffCode: 'INP-02',
    name: 'Jordan Miller',
    email: 'jordan.miller@omnistock.internal',
    phone: '+1 (555) 345-6789',
    pin: '2468',
    role: 'retail_inputer',
    assignedLocationId: 'loc_store_northside',
    status: 'active',
    receiptsPrintedCount: 28,
    totalSalesVolume: 3890.20,
    createdAt: '2026-08-15T09:00:00Z',
    lastActiveAt: '2026-10-25T16:30:00Z'
  },
  {
    id: 'inp_chloe_dupont',
    staffCode: 'INP-03',
    name: 'Chloe Dupont',
    email: 'chloe.dupont@omnistock.internal',
    phone: '+1 (555) 456-7890',
    pin: '9876',
    role: 'wholesale_inputer',
    assignedLocationId: 'loc_wh_central',
    status: 'active',
    receiptsPrintedCount: 15,
    totalSalesVolume: 18450.00,
    createdAt: '2026-09-01T08:30:00Z',
    lastActiveAt: '2026-10-25T14:15:00Z'
  }
];

export const INITIAL_INPUTER_ACTIVITIES: InputerActivity[] = [
  // --- Alexander Wright (INP-01) activities ---
  {
    id: 'act_aw_1',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Completed retail counter checkout of 3 items to Walk-in Retail Customer',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-1002',
    amount: 145.20,
    timestamp: '2026-10-25T17:45:00Z'
  },
  {
    id: 'act_aw_2',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Generated 80mm thermal receipt customer slip',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-1002',
    timestamp: '2026-10-25T17:45:15Z'
  },
  {
    id: 'act_aw_3',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'stock_adjustment',
    title: 'Physical Audit Adjustment',
    description: 'Adjusted Arcadia Whole Bean stock (+2 units) following daily display check',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'ADJ-8821',
    timestamp: '2026-10-25T16:10:00Z'
  },
  {
    id: 'act_aw_4',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Completed retail transaction with cash payment',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-0984',
    amount: 72.50,
    timestamp: '2026-10-25T15:20:00Z'
  },
  {
    id: 'act_aw_5',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Receipt handed to customer',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-0984',
    timestamp: '2026-10-25T15:20:20Z'
  },
  {
    id: 'act_aw_6',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'login',
    title: 'Terminal Station Authenticated',
    description: 'Staff PIN entered on POS Web Terminal Station REG-FLG-01',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    timestamp: '2026-10-25T13:30:00Z'
  },
  {
    id: 'act_aw_7',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Processed credit card checkout for Mechanical Keyboard',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-0922',
    amount: 159.00,
    timestamp: '2026-10-25T11:45:00Z'
  },
  {
    id: 'act_aw_8',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Receipt registered and printed',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'POS-2026-0922',
    timestamp: '2026-10-25T11:45:10Z'
  },
  {
    id: 'act_aw_9',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'shift_opened',
    title: 'Shift Opened',
    description: 'Opened register REG-FLG-01 with opening float $250.00',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    referenceNumber: 'REG-FLG-01',
    amount: 250.00,
    timestamp: '2026-10-25T08:00:00Z'
  },
  {
    id: 'act_aw_10',
    inputerId: 'INP-01',
    inputerName: 'Alexander Wright',
    actionType: 'login',
    title: 'Terminal Morning Login',
    description: 'Initial shift login via direct web link',
    locationId: 'loc_store_flagship',
    locationName: 'Downtown Flagship Store',
    timestamp: '2026-10-25T07:58:00Z'
  },

  // --- Jordan Miller (INP-02) activities ---
  {
    id: 'act_jm_1',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Completed retail counter checkout of matcha and olive oil',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-1003',
    amount: 68.40,
    timestamp: '2026-10-25T16:30:00Z'
  },
  {
    id: 'act_jm_2',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Thermal receipt printed for walk-in patron',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-1003',
    timestamp: '2026-10-25T16:30:12Z'
  },
  {
    id: 'act_jm_3',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'stock_adjustment',
    title: 'Stock Adjustment (Restock)',
    description: 'Verified inbound inter-branch transfer TRF-WH-RET-08 (+8 units Matcha)',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'TRF-WH-RET-08',
    timestamp: '2026-10-25T14:50:00Z'
  },
  {
    id: 'act_jm_4',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Completed retail transaction via contactless card',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-0965',
    amount: 219.00,
    timestamp: '2026-10-25T13:15:00Z'
  },
  {
    id: 'act_jm_5',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Receipt issued',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-0965',
    timestamp: '2026-10-25T13:15:15Z'
  },
  {
    id: 'act_jm_6',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'login',
    title: 'Terminal Station Authenticated',
    description: 'Staff PIN entered on POS Web Terminal Station REG-NOR-01',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    timestamp: '2026-10-25T12:00:00Z'
  },
  {
    id: 'act_jm_7',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'sale_completed',
    title: 'POS Sale Completed',
    description: 'Retail checkout of craft cider crates',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-0941',
    amount: 84.00,
    timestamp: '2026-10-25T10:40:00Z'
  },
  {
    id: 'act_jm_8',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'receipt_printed',
    title: 'Receipt Printed',
    description: 'Thermal print complete',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'POS-2026-0941',
    timestamp: '2026-10-25T10:40:10Z'
  },
  {
    id: 'act_jm_9',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'shift_opened',
    title: 'Shift Opened',
    description: 'Opened register REG-NOR-01 with opening float $200.00',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    referenceNumber: 'REG-NOR-01',
    amount: 200.00,
    timestamp: '2026-10-25T09:00:00Z'
  },
  {
    id: 'act_jm_10',
    inputerId: 'INP-02',
    inputerName: 'Jordan Miller',
    actionType: 'login',
    title: 'Morning Station Login',
    description: 'Authenticated via staff link on iPad terminal',
    locationId: 'loc_store_northside',
    locationName: 'Northside Boutique',
    timestamp: '2026-10-25T08:55:00Z'
  },

  // --- Chloe Dupont (INP-03) activities ---
  {
    id: 'act_cd_1',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'sale_completed',
    title: 'Wholesale Invoice Executed',
    description: 'Issued commercial wholesale invoice to Artisan Brew Labs (Net 30 terms)',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8192',
    amount: 4280.00,
    timestamp: '2026-10-25T14:15:00Z'
  },
  {
    id: 'act_cd_2',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'receipt_printed',
    title: 'B2B Bill & Packing Slip Printed',
    description: 'Generated commercial invoice statement & warehouse dock receipt',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8192',
    timestamp: '2026-10-25T14:15:30Z'
  },
  {
    id: 'act_cd_3',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'stock_adjustment',
    title: 'Bulk Warehouse Pallet Adjustment',
    description: 'Verified inbound shipment of 50 cartons EVOO, lot LOT-2026-EV21',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'ADJ-WH-402',
    timestamp: '2026-10-25T13:00:00Z'
  },
  {
    id: 'act_cd_4',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'sale_completed',
    title: 'Wholesale Invoice Executed',
    description: 'Processed corporate procurement order for Thunderbolt USB Docks',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8170',
    amount: 3240.00,
    timestamp: '2026-10-25T11:20:00Z'
  },
  {
    id: 'act_cd_5',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'receipt_printed',
    title: 'Invoice Statement Printed',
    description: 'Commercial invoice printed for dispatch team',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8170',
    timestamp: '2026-10-25T11:20:25Z'
  },
  {
    id: 'act_cd_6',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'login',
    title: 'Warehouse Desk Terminal Login',
    description: 'Staff PIN authenticated on wholesale desk workstation',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    timestamp: '2026-10-25T09:30:00Z'
  },
  {
    id: 'act_cd_7',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'stock_adjustment',
    title: 'Lot Cycle Count Audit',
    description: 'Cycle count audit of climate room matcha inventory',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'AUD-MTC-01',
    timestamp: '2026-10-25T09:00:00Z'
  },
  {
    id: 'act_cd_8',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'sale_completed',
    title: 'Wholesale Invoice Executed',
    description: 'Order fulfillment for Metro Hospitality Group',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8155',
    amount: 5120.00,
    timestamp: '2026-10-24T16:40:00Z'
  },
  {
    id: 'act_cd_9',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'receipt_printed',
    title: 'Dispatch Slip Printed',
    description: 'Printed wholesale manifest receipt',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    referenceNumber: 'INV-WS-8155',
    timestamp: '2026-10-24T16:40:15Z'
  },
  {
    id: 'act_cd_10',
    inputerId: 'INP-03',
    inputerName: 'Chloe Dupont',
    actionType: 'login',
    title: 'Desk Terminal Login',
    description: 'Authenticated via staff PIN on warehouse portal',
    locationId: 'loc_wh_central',
    locationName: 'Central Distribution Center',
    timestamp: '2026-10-24T08:30:00Z'
  }
];

export const INITIAL_LINKED_BANKS: LinkedBankAccount[] = [
  {
    id: 'bnk_chase_merchant',
    bankName: 'JPMorgan Chase Bank',
    accountName: 'OmniStock Primary Merchant Operating',
    accountNumber: '•••• 6821',
    routingNumber: '071000013',
    swiftBic: 'CHASUS33',
    currency: 'USD',
    accountType: 'merchant_settlement',
    isDefault: true,
    status: 'active',
    balance: 148520.45,
    lastSyncedAt: '2026-10-27T08:30:00Z',
    autoVerifyIncoming: true
  },
  {
    id: 'bnk_bofa_reserve',
    bankName: 'Bank of America',
    accountName: 'OmniStock Wholesale Reserve & Payroll',
    accountNumber: '•••• 9403',
    routingNumber: '026009593',
    swiftBic: 'BOFAUS3N',
    currency: 'USD',
    accountType: 'checking',
    isDefault: false,
    status: 'active',
    balance: 82340.00,
    lastSyncedAt: '2026-10-27T08:00:00Z',
    autoVerifyIncoming: true
  }
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'btx_101',
    bankAccountId: 'bnk_chase_merchant',
    bankName: 'JPMorgan Chase Bank',
    orderId: 'ord_pos_101',
    orderNumber: 'POS-2026-8921',
    referenceCode: 'BNK-TX-94821',
    type: 'credit_sale',
    amount: 142.50,
    currency: 'USD',
    senderName: 'Michael Sterling (Direct Bank Pay)',
    status: 'verified',
    verifiedAt: '2026-10-27T07:45:12Z',
    verifiedBy: 'instant_api',
    description: 'Instant Bank Pay settlement for POS-2026-8921',
    createdAt: '2026-10-27T07:45:00Z'
  },
  {
    id: 'btx_102',
    bankAccountId: 'bnk_chase_merchant',
    bankName: 'JPMorgan Chase Bank',
    orderId: 'ord_ws_202',
    orderNumber: 'INV-WS-8155',
    referenceCode: 'BNK-TX-94822',
    type: 'wholesale_settlement',
    amount: 5120.00,
    currency: 'USD',
    senderName: 'Metro Hospitality Group (Fedwire)',
    status: 'verified',
    verifiedAt: '2026-10-26T16:42:00Z',
    verifiedBy: 'auto_bank_webhook',
    description: 'B2B Wholesale Wire Invoice Settlement INV-WS-8155',
    createdAt: '2026-10-26T16:40:00Z'
  },
  {
    id: 'btx_103',
    bankAccountId: 'bnk_bofa_reserve',
    bankName: 'Bank of America',
    referenceCode: 'BNK-TX-94823',
    type: 'transfer_in',
    amount: 12500.00,
    currency: 'USD',
    senderName: 'Capital Reserve Replenishment',
    status: 'verified',
    verifiedAt: '2026-10-25T11:20:00Z',
    verifiedBy: 'auto_bank_webhook',
    description: 'Inter-account operating buffer settlement',
    createdAt: '2026-10-25T11:15:00Z'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po_001',
    poNumber: 'PO-2026-001',
    supplierName: 'Addis Highland Growers Co.',
    supplierEmail: 'supply@addishighlands.com',
    supplierContact: '+1 (555) 234-5678',
    destinationLocationId: 'loc_wh_central',
    destinationLocationName: 'Central Distribution Center',
    status: 'ordered',
    items: [
      {
        productId: 'prod_eth_yirg',
        productName: 'Arcadia Yirgacheffe Washed Grade 1',
        sku: 'COF-ETH-YRG',
        quantity: 150,
        unitCost: 11.20,
        receivedQuantity: 0
      }
    ],
    totalCost: 1680.00,
    createdAt: '2026-10-24T09:00:00Z',
    expectedDeliveryDate: '2026-10-30',
    notes: 'Q4 Reserve stock replenishment',
    createdBy: 'Inventory Director'
  },
  {
    id: 'po_002',
    poNumber: 'PO-2026-002',
    supplierName: 'Olio Frantoio Greve SRL',
    supplierEmail: 'orders@frantoiogreve.it',
    destinationLocationId: 'loc_wh_central',
    destinationLocationName: 'Central Distribution Center',
    status: 'received',
    items: [
      {
        productId: 'prod_tusc_oil',
        productName: 'Tuscan Estate Extra Virgin Olive Oil 750ml',
        sku: 'OIL-ITA-750',
        quantity: 80,
        unitCost: 16.50,
        receivedQuantity: 80
      }
    ],
    totalCost: 1320.00,
    createdAt: '2026-10-18T10:30:00Z',
    receivedAt: '2026-10-23T14:15:00Z',
    notes: 'Batch lot inspected and cleared customs',
    createdBy: 'Inventory Director'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_001',
    timestamp: '2026-10-27T08:14:00Z',
    actorId: 'usr_admin',
    actorName: 'Admin System',
    role: 'Administrator',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'auth',
    entityId: 'sys_root',
    details: 'OmniStock ERP initialized with secure in-memory and Firestore persistence engine'
  },
  {
    id: 'audit_002',
    timestamp: '2026-10-27T07:45:12Z',
    actorId: 'INP-01',
    actorName: 'Marcus Vance',
    role: 'Retail Senior Cashier',
    action: 'SALE_COMPLETED',
    entityType: 'order',
    entityId: 'POS-2026-8921',
    details: 'Completed retail sale $96.94 with Instant Bank Pay verification'
  },
  {
    id: 'audit_003',
    timestamp: '2026-10-26T16:42:00Z',
    actorId: 'usr_admin',
    actorName: 'Admin System',
    role: 'Administrator',
    action: 'BANK_TX_VERIFIED',
    entityType: 'bank',
    entityId: 'BNK-TX-94822',
    details: 'Verified incoming wholesale settlement of $5,120.00 for order INV-WS-8155'
  }
];


