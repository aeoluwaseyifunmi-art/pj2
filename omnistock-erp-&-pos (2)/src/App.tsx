import React, { useState, useEffect } from 'react';
import { dbStore, DatabaseState } from './db/databaseStore';
import { Header } from './components/layout/Header';
import { PosTerminal } from './components/pos/PosTerminal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { WholesaleOrders } from './components/wholesale/WholesaleOrders';
import { PosReporting } from './components/reports/PosReporting';
import { DatabaseStudio } from './components/database/DatabaseStudio';
import { WorkspaceHub } from './components/workspace/WorkspaceHub';
import { InputerManagement } from './components/inputer/InputerManagement';
import { DedicatedInputerTerminal } from './components/inputer/DedicatedInputerTerminal';
import { ProductCatalog } from './components/products/ProductCatalog';
import { AddProductSellModal } from './components/products/AddProductSellModal';
import { LocationManagerModal } from './components/location/LocationManagerModal';
import { CategoryManagerModal } from './components/products/CategoryManagerModal';
import { BankHub } from './components/bank/BankHub';
import { ThemeProvider } from './context/ThemeContext';

function MainApp() {
  const [dbState, setDbState] = useState<DatabaseState>(() => dbStore.getState());
  const [currentTab, setCurrentTab] = useState<string>('products');
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [selectedProductToSell, setSelectedProductToSell] = useState<string | null>(null);

  // Dedicated Web Terminal Mode (Supports direct URL ?portal=inputer&staffCode=INP-01)
  const [isTerminalMode, setIsTerminalMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portal') === 'inputer' || Boolean(params.get('staffCode') || params.get('staffId'));
  });
  const [terminalStaffCode, setTerminalStaffCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('staffCode') || params.get('staffId') || 'INP-01';
  });

  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setDbState({ ...dbStore.getState() });
    });
    return unsubscribe;
  }, []);

  const activeLocationId = dbStore.getActiveLocationId();
  const activeLocation =
    dbState.locations.find((l) => l.id === activeLocationId) || dbState.locations[0];
  const defaultBank =
    dbState.linkedBankAccounts?.find((b) => b.isDefault) || dbState.linkedBankAccounts?.[0];

  const handleResetData = () => {
    if (window.confirm('Reset database to initial enterprise demo dataset? All custom test transactions will be re-initialized.')) {
      dbStore.resetToFactory();
    }
  };

  const handleOpenTerminal = (staffCode?: string) => {
    if (staffCode) {
      setTerminalStaffCode(staffCode);
    }
    setIsTerminalMode(true);
    // Update browser URL query params without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('portal', 'inputer');
    if (staffCode) {
      url.searchParams.set('staffCode', staffCode);
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleExitTerminal = () => {
    setIsTerminalMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    url.searchParams.delete('staffCode');
    url.searchParams.delete('staffId');
    window.history.pushState({}, '', url.toString());
  };

  // If in Dedicated Inputer Web Terminal mode:
  if (isTerminalMode) {
    return (
      <DedicatedInputerTerminal
        initialStaffCode={terminalStaffCode}
        onExitToAdmin={handleExitTerminal}
      />
    );
  }

  // Admin ERP & POS Hub
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickSale={() => setCurrentTab('pos')}
        onOpenAddProduct={() => setShowAddProductModal(true)}
        onResetData={handleResetData}
        onOpenTerminal={() => handleOpenTerminal()}
        activeLocation={activeLocation}
        defaultBank={defaultBank}
        onOpenLocationManager={() => setShowLocationModal(true)}
        onOpenCategoryManager={() => setShowCategoryModal(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'products' && (
          <ProductCatalog
            dbState={dbState}
            onNavigateToPosWithProduct={(prodId) => {
              setSelectedProductToSell(prodId);
              setCurrentTab('pos');
            }}
            onOpenLocationManager={() => setShowLocationModal(true)}
          />
        )}

        {currentTab === 'bank' && (
          <BankHub dbState={dbState} />
        )}

        {currentTab === 'pos' && (
          <PosTerminal
            dbState={dbState}
            initialProductId={selectedProductToSell}
            onClearInitialProduct={() => setSelectedProductToSell(null)}
          />
        )}

        {currentTab === 'inputers' && (
          <div className="p-6 max-w-7xl mx-auto">
            <InputerManagement
              onOpenTerminal={(code) => handleOpenTerminal(code)}
            />
          </div>
        )}

        {currentTab === 'inventory' && (
          <InventoryManager dbState={dbState} />
        )}

        {currentTab === 'wholesale' && (
          <WholesaleOrders
            dbState={dbState}
            onNavigateToPos={() => setCurrentTab('pos')}
          />
        )}

        {currentTab === 'reporting' && (
          <PosReporting dbState={dbState} />
        )}

        {currentTab === 'workspace' && (
          <WorkspaceHub dbState={dbState} />
        )}

        {currentTab === 'database' && (
          <DatabaseStudio dbState={dbState} />
        )}
      </main>

      {/* Add Product You Sell Modal */}
      {showAddProductModal && (
        <AddProductSellModal
          dbState={dbState}
          onClose={() => setShowAddProductModal(false)}
        />
      )}

      {/* Store & Warehouse Location Manager Modal */}
      {showLocationModal && (
        <LocationManagerModal
          dbState={dbState}
          activeLocationId={activeLocationId}
          onSelectActiveLocation={(id) => {
            dbStore.setActiveLocationId(id);
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {/* Custom Category Manager Modal */}
      {showCategoryModal && (
        <CategoryManagerModal
          dbState={dbState}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
