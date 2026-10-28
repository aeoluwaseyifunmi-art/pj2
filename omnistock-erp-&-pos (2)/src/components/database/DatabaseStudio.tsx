import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import {
  Database,
  Terminal,
  Table,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Code2,
  Server
} from 'lucide-react';

interface DatabaseStudioProps {
  dbState: DatabaseState;
}

export const DatabaseStudio: React.FC<DatabaseStudioProps> = ({ dbState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'schema' | 'tables'>('console');

  // SQL Console state
  const defaultSql = 'SELECT * FROM products ORDER BY retailPrice DESC';
  const [sqlQuery, setSqlQuery] = useState(defaultSql);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    rowCount: number;
    error?: string;
  } | null>(() => dbStore.executeQuery(defaultSql));

  const [copiedQuery, setCopiedQuery] = useState(false);
  const [selectedTable, setSelectedTable] = useState<keyof DatabaseState>('products');

  const presetQueries = [
    {
      title: 'Top Products by Retail Price',
      sql: 'SELECT * FROM products ORDER BY retailPrice DESC'
    },
    {
      title: 'All Active Inventory Levels',
      sql: 'SELECT * FROM inventory'
    },
    {
      title: 'Wholesale B2B Orders',
      sql: "SELECT * FROM orders WHERE channel = 'wholesale'"
    },
    {
      title: 'Real-Time Stock Audit Movements',
      sql: 'SELECT * FROM stock_movements ORDER BY timestamp DESC LIMIT 20'
    },
    {
      title: 'Commercial Wholesale Customers',
      sql: "SELECT * FROM customers WHERE type = 'wholesale_business'"
    },
    {
      title: 'Volume Pricing Tiers',
      sql: 'SELECT * FROM price_tiers ORDER BY minQuantity ASC'
    }
  ];

  const handleRunQuery = () => {
    const res = dbStore.executeQuery(sqlQuery);
    setQueryResult(res);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleExportFullJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omnistock_db_dump_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const schemaEntities = [
    {
      name: 'products',
      pk: 'id',
      description: 'Master catalog items with dual retail MSRP and wholesale base pricing',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'sku', type: 'VARCHAR(64)', isPk: false },
        { name: 'barcode', type: 'VARCHAR(64)', isPk: false },
        { name: 'name', type: 'VARCHAR(255)', isPk: false },
        { name: 'category', type: 'VARCHAR(100)', isPk: false },
        { name: 'costPrice', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'retailPrice', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'wholesaleBasePrice', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'minWholesaleQty', type: 'INT', isPk: false },
        { name: 'reorderThreshold', type: 'INT', isPk: false }
      ]
    },
    {
      name: 'inventory_levels',
      pk: 'id',
      description: 'Location-specific physical inventory balances and lot/batch allocations',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'productId', type: 'FK -> products.id', isPk: false },
        { name: 'locationId', type: 'FK -> locations.id', isPk: false },
        { name: 'quantityOnHand', type: 'INT', isPk: false },
        { name: 'batchLot', type: 'VARCHAR(64)', isPk: false },
        { name: 'binLocation', type: 'VARCHAR(64)', isPk: false },
        { name: 'updatedAt', type: 'TIMESTAMPTZ', isPk: false }
      ]
    },
    {
      name: 'locations',
      pk: 'id',
      description: 'Central distribution centers, storefronts, and warehouse facilities',
      columns: [
        { name: 'id', type: 'VARCHAR(64)', isPk: true },
        { name: 'name', type: 'VARCHAR(255)', isPk: false },
        { name: 'code', type: 'VARCHAR(16)', isPk: false },
        { name: 'type', type: 'ENUM(warehouse, retail_store)', isPk: false },
        { name: 'address', type: 'TEXT', isPk: false }
      ]
    },
    {
      name: 'price_tiers',
      pk: 'id',
      description: 'Volume discount pricing curves for bulk B2B purchases',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'productId', type: 'FK -> products.id', isPk: false },
        { name: 'minQuantity', type: 'INT', isPk: false },
        { name: 'tierLabel', type: 'VARCHAR(100)', isPk: false },
        { name: 'unitPrice', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'discountPercent', type: 'DECIMAL(5,2)', isPk: false }
      ]
    },
    {
      name: 'customers',
      pk: 'id',
      description: 'Retail patrons, VIP members, and verified wholesale tax-exempt businesses',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'name', type: 'VARCHAR(255)', isPk: false },
        { name: 'companyName', type: 'VARCHAR(255)', isPk: false },
        { name: 'type', type: 'ENUM(retail, wholesale)', isPk: false },
        { name: 'taxId', type: 'VARCHAR(64)', isPk: false },
        { name: 'paymentTerms', type: 'VARCHAR(16)', isPk: false },
        { name: 'creditLimit', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'outstandingBalance', type: 'DECIMAL(10,2)', isPk: false }
      ]
    },
    {
      name: 'orders',
      pk: 'id',
      description: 'POS register checkouts and B2B commercial invoices with line items',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'orderNumber', type: 'VARCHAR(64)', isPk: false },
        { name: 'channel', type: 'ENUM(retail, wholesale)', isPk: false },
        { name: 'locationId', type: 'FK -> locations.id', isPk: false },
        { name: 'customerId', type: 'FK -> customers.id', isPk: false },
        { name: 'subtotal', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'grandTotal', type: 'DECIMAL(10,2)', isPk: false },
        { name: 'paymentMethod', type: 'VARCHAR(32)', isPk: false },
        { name: 'createdAt', type: 'TIMESTAMPTZ', isPk: false }
      ]
    },
    {
      name: 'stock_movements',
      pk: 'id',
      description: 'Immutable ledger tracking stock debits and credits across all facilities',
      columns: [
        { name: 'id', type: 'UUID', isPk: true },
        { name: 'timestamp', type: 'TIMESTAMPTZ', isPk: false },
        { name: 'productId', type: 'FK -> products.id', isPk: false },
        { name: 'locationId', type: 'FK -> locations.id', isPk: false },
        { name: 'type', type: 'VARCHAR(32)', isPk: false },
        { name: 'quantityChange', type: 'INT', isPk: false },
        { name: 'referenceNumber', type: 'VARCHAR(64)', isPk: false },
        { name: 'operator', type: 'VARCHAR(100)', isPk: false }
      ]
    }
  ];

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await dbStore.syncToCloudFirestore();
    setSyncStatus(res.message);
    setIsSyncing(false);
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await dbStore.fetchFromCloudFirestore();
    setSyncStatus(res.message);
    setIsSyncing(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Database Architecture & SQL Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cloud database storage, relational schema models, ad-hoc SQL query console, and database dump exporter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFullJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Dump (JSON)</span>
          </button>
          <button
            onClick={() => dbStore.resetToFactory()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-900/60 border border-slate-700 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {/* Cloud Database Status Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Google Cloud Database Storage</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Active · europe-west1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Project: <span className="text-slate-200">gen-lang-client-0100943269</span> · Firestore Cloud Instance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePullFromCloud}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded transition-colors"
          >
            <span>Pull from Cloud</span>
          </button>
          <button
            onClick={handlePushToCloud}
            disabled={isSyncing}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>{isSyncing ? 'Synchronizing...' : 'Sync to Cloud Database'}</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-emerald-300">
          {syncStatus}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-md w-fit">
        <button
          onClick={() => setActiveSubTab('console')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'console'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Interactive SQL Console</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'schema'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Relational Schema (ERD)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tables')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'tables'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Raw Table Inspector</span>
        </button>
      </div>

      {/* SUBVIEW 1: Interactive SQL Console */}
      {activeSubTab === 'console' && (
        <div className="space-y-4">
          {/* Query Editor & Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>SQL Query Editor</span>
              </span>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
                {presetQueries.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlQuery(pq.sql);
                      const res = dbStore.executeQuery(pq.sql);
                      setQueryResult(res);
                    }}
                    className="px-2 py-0.5 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                  >
                    {pq.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 rounded focus:outline-hidden focus:border-emerald-500"
              />
              <button
                onClick={() => handleCopy(sqlQuery)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900/80 rounded"
              >
                {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono">
                Supports SELECT, FROM, WHERE, ORDER BY, LIMIT on products, inventory, orders, customers, etc.
              </span>
              <button
                onClick={handleRunQuery}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Query</span>
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {queryResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300">
                  Query Results: <span className="text-emerald-400 font-bold">{queryResult.rowCount} rows</span> returned
                </span>
                <span className="text-slate-400 text-[11px]">
                  Execution time: {queryResult.executionTimeMs} ms
                </span>
              </div>

              {queryResult.error ? (
                <div className="p-4 text-xs font-mono text-rose-400 bg-rose-950/20">
                  {queryResult.error}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 sticky top-0">
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-300 font-mono">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: Relational Schema Diagram (ERD) */}
      {activeSubTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemaEntities.map((ent) => (
            <div key={ent.name} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-bold text-white text-xs">{ent.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">PK: {ent.pk}</span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans">{ent.description}</p>

              <div className="space-y-1 font-mono text-xs">
                {ent.columns.map((col, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-slate-300 border-b border-slate-800/30">
                    <span className={col.isPk ? 'text-emerald-400 font-bold' : ''}>
                      {col.isPk ? '🔑 ' : '  '}{col.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBVIEW 3: Raw Table Inspector */}
      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Table:</span>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value as keyof DatabaseState)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
            >
              <option value="products">products ({dbState.products.length} records)</option>
              <option value="inventory">inventory ({dbState.inventory.length} records)</option>
              <option value="orders">orders ({dbState.orders.length} records)</option>
              <option value="customers">customers ({dbState.customers.length} records)</option>
              <option value="stockMovements">stockMovements ({dbState.stockMovements.length} records)</option>
              <option value="priceTiers">priceTiers ({dbState.priceTiers.length} records)</option>
              <option value="locations">locations ({dbState.locations.length} records)</option>
              <option value="shifts">shifts ({dbState.shifts.length} records)</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-h-[500px]">
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(dbState[selectedTable], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
