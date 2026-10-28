import React from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  Printer,
  PackagePlus,
  MapPin,
  ChevronDown,
  Tag,
  Landmark,
  ShieldCheck,
  Barcode
} from 'lucide-react';
import { Location, LinkedBankAccount } from '../../types/database';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenAddProduct?: () => void;
  onResetData: () => void;
  onOpenTerminal: () => void;
  activeLocation?: Location;
  defaultBank?: LinkedBankAccount;
  onOpenLocationManager?: () => void;
  onOpenCategoryManager?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenBarcodePrint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickSale,
  onOpenAddProduct,
  onResetData,
  onOpenTerminal,
  activeLocation,
  defaultBank,
  onOpenLocationManager,
  onOpenCategoryManager,
  onOpenAuditLogs,
  onOpenBarcodePrint
}) => {
  const navItems = [
    { id: 'ai', label: '✨ AI Intelligence' },
    { id: 'pos', label: 'POS Terminal' },
    { id: 'products', label: 'Products I Sell' },
    { id: 'purchase_orders', label: 'Purchase Orders' },
    { id: 'bank', label: 'Bank & Settlement' },
    { id: 'inputers', label: 'Staff Inputers' },
    { id: 'inventory', label: 'Live Inventory' },
    { id: 'wholesale', label: 'Wholesale B2B' },
    { id: 'reporting', label: 'POS Analytics' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'database', label: 'SQL Studio' }
  ];

  return (
    <div className="sticky top-0 z-30 flex flex-col border-b border-slate-800 bg-slate-900 text-slate-200">
      {/* Editorial Micro System-Bar (Variation 12 inspired) */}
      <div className="flex items-center justify-between px-6 py-1 bg-slate-950 border-b border-slate-800/80 font-mono text-[10px] tracking-wider text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM::STABLE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">OMNISTOCK ERP & POS v4.02</span>
        </div>

        {/* Center / Right: Active Location Switcher */}
        <div className="flex items-center gap-2">
          {onOpenLocationManager && (
            <button
              onClick={onOpenLocationManager}
              title="Click to change active store/warehouse location or add a new branch"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="font-sans font-medium text-xs text-white">
                {activeLocation?.name || 'Retail Flagship'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                [{activeLocation?.code || 'LOC-01'}]
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          )}

          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              title="Manage product categories"
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer text-[10px]"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>Categories</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('bank')}
            title="Linked Bank Settlement Account & Auto-Verified Transactions"
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
              currentTab === 'bank'
                ? 'bg-emerald-950 border-emerald-500/80 text-emerald-300 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Landmark className="w-2.5 h-2.5 text-emerald-400" />
            <span className="font-sans font-medium text-white">
              {defaultBank?.bankName?.split(' ')[0] || 'Chase'}
            </span>
            <span className="font-mono text-slate-400">
              {defaultBank?.accountNumber || '••••6821'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="flex items-center justify-between gap-6 px-6 py-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Database className="w-4 h-4" />
          </div>
          <button
            onClick={() => onSelectTab('products')}
            className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors text-left cursor-pointer"
          >
            OmniStock ERP
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
                  isActive ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle variant="header" showLabel={false} />

          {onOpenLocationManager && (
            <button
              onClick={onOpenLocationManager}
              title="Add or Edit Locations manually"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locations</span>
            </button>
          )}

          {onOpenBarcodePrint && (
            <button
              onClick={onOpenBarcodePrint}
              title="Print product barcode labels & shelf price stickers"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Barcode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Barcodes</span>
            </button>
          )}

          {onOpenAuditLogs && (
            <button
              onClick={onOpenAuditLogs}
              title="Security, Audit Trails & Database Backups"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit & Backup</span>
            </button>
          )}

          {onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              title="Add a new product you sell to your catalog"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>+ Add Product</span>
            </button>
          )}

          <button
            onClick={onOpenTerminal}
            title="Launch dedicated Inputer POS Web Terminal (Receipts & Quick Entry)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Terminal</span>
          </button>

          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset database to initial demo dataset"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile Nav strip for small screens */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-2 bg-slate-950 overflow-x-auto text-xs border-t border-slate-800/60">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
