import React, { useState, useMemo } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { LinkedBankAccount, BankTransaction } from '../../types/database';
import {
  Landmark,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Building2,
  Trash2,
  Check,
  Zap,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { LinkBankAccountModal } from './LinkBankAccountModal';

interface BankHubProps {
  dbState: DatabaseState;
}

export const BankHub: React.FC<BankHubProps> = ({ dbState }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);

  // Simulation form
  const [simAmount, setSimAmount] = useState<number>(185.00);
  const [simSender, setSimSender] = useState<string>('Apex Specialty Grocers (Wire Transfer)');
  const linkedBanks = dbState?.linkedBankAccounts || [];
  const transactions = dbState?.bankTransactions || [];

  const [simBankId, setSimBankId] = useState<string>(
    () => (dbState?.linkedBankAccounts?.[0]?.id || '')
  );

  // Metrics
  const totalSettledBalance = useMemo(() => {
    return linkedBanks.reduce((sum, b) => sum + (b.balance || 0), 0);
  }, [linkedBanks]);

  const verifiedCount = useMemo(() => {
    return transactions.filter((t) => t.status === 'verified').length;
  }, [transactions]);

  const totalVerifiedVolume = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'verified')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === 'verified' && t.status !== 'verified') return false;
      if (filterType === 'sales' && t.type !== 'credit_sale') return false;
      if (filterType === 'wholesale' && t.type !== 'wholesale_settlement') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = t.referenceCode.toLowerCase().includes(q);
        const matchBank = t.bankName.toLowerCase().includes(q);
        const matchSender = t.senderName.toLowerCase().includes(q);
        const matchOrder = (t.orderNumber || '').toLowerCase().includes(q);
        return matchRef || matchBank || matchSender || matchOrder;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery]);

  const handleSimulateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAmount || simAmount <= 0) return;

    setIsSimulating(true);

    setTimeout(() => {
      const targetBank = linkedBanks.find((b) => b.id === simBankId) || linkedBanks[0];
      const created = dbStore.simulateIncomingBankTransfer(
        simAmount,
        simSender,
        undefined,
        targetBank?.id
      );

      setIsSimulating(false);
      setSimulationSuccess(
        `Received & Verified payment of $${simAmount.toFixed(2)} from ${simSender}! Reference: ${created.referenceCode}`
      );
      setTimeout(() => setSimulationSuccess(null), 5000);
    }, 900);
  };

  const handleSetDefaultBank = (id: string) => {
    dbStore.setDefaultBankAccount(id);
  };

  const handleDeleteBank = (id: string, name: string) => {
    if (linkedBanks.length <= 1) {
      alert('You must keep at least one linked settlement bank account.');
      return;
    }
    if (window.confirm(`Disconnect bank account "${name}"?`)) {
      dbStore.deleteLinkedBankAccount(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Heading (Editorial Garamond & Space Mono) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 tracking-widest uppercase mb-1">
            <span>SETTLEMENT CLEARING & BANKING INTEGRATION</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              AUTO-VERIFY ACTIVE
            </span>
          </div>
          <h1 className="text-3xl font-normal font-serif text-white tracking-tight">
            Bank Accounts & Verified Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Link and manage your business bank accounts. Incoming customer transfers and POS bank payments are automatically verified and marked as Done in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Link Bank Account</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Settled Bank Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            ${totalSettledBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Across {linkedBanks.length} linked accounts</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Auto-Verified Transactions</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
            {verifiedCount} Done
          </div>
          <div className="text-[11px] text-slate-400">100% matched & cleared</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verified Settlement Volume</span>
            <Landmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
            ${totalVerifiedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Directly cleared through bank</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verification Network</span>
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">Instant</span>
            <span className="text-xs text-slate-400">webhook/api</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            Real-time bank matching active
          </div>
        </div>
      </div>

      {/* Section 1: Linked Bank Accounts Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Connected Bank Accounts ({linkedBanks.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Primary account automatically receives retail & wholesale settlements
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedBanks.map((bank) => (
            <div
              key={bank.id}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                bank.isDefault
                  ? 'border-emerald-500/80 bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight leading-tight">
                        {bank.bankName}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400">
                        {bank.accountNumber}
                      </p>
                    </div>
                  </div>

                  {bank.isDefault ? (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultBank(bank.id)}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 border border-slate-700 px-2 py-0.5 rounded hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      Set Primary
                    </button>
                  )}
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    {bank.accountName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    {bank.routingNumber && <span>Routing: {bank.routingNumber}</span>}
                    {bank.swiftBic && <span>• SWIFT: {bank.swiftBic}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-mono uppercase">Settled Balance</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    ${(bank.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium font-mono text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AUTO-VERIFY ON
                  </span>

                  {linkedBanks.length > 1 && !bank.isDefault && (
                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                      title="Disconnect bank account"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Bank Card Action */}
          <button
            onClick={() => setShowLinkModal(true)}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-900/40 transition-all cursor-pointer group min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white block">
                Link Additional Bank Account
              </span>
              <span className="text-[11px] text-slate-400">
                Support multi-currency or secondary settlement
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Section 2: Interactive Bank Transfer Simulation & Auto-Verify Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Bank Transfer & Auto-Verify (Live Demonstration)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Test how an incoming customer wire or bank transfer is detected, verified, and settled into your linked bank
            </p>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/80">
            AUTO-RECONCILIATION ENGINE READY
          </span>
        </div>

        <form onSubmit={handleSimulateTransfer} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-3">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">TRANSFER AMOUNT ($)</label>
            <input
              type="number"
              step="0.01"
              value={simAmount}
              onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">CUSTOMER / SENDER NAME</label>
            <input
              type="text"
              value={simSender}
              onChange={(e) => setSimSender(e.target.value)}
              placeholder="e.g. Acme Corp Direct Wire"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">DESTINATION BANK</label>
            <select
              value={simBankId}
              onChange={(e) => setSimBankId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {linkedBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} ({b.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send & Verify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {simulationSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-lg flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulationSuccess}</span>
          </div>
        )}
      </div>

      {/* Section 3: Live Transactions Done Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-serif">
              <span>Transactions Done (Auto-Verified Ledger)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete audit trail of all auto-verified bank transfers, retail settlements, and wholesale invoice payments
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, order, sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('verified')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterType === 'verified' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified Done ({verifiedCount})
              </button>
              <button
                onClick={() => setFilterType('sales')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterType === 'sales' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Retail Sales
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Done Table */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No bank transactions found</p>
            <p className="text-xs text-slate-500">
              Process a transaction in the POS Terminal with Bank Transfer or run the live simulation above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Status & Reference</th>
                  <th className="py-3 px-4">Linked Settlement Bank</th>
                  <th className="py-3 px-4">Sender / Customer</th>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Verification Method</th>
                  <th className="py-3 px-4 text-right">Cleared At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Status & Reference */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>DONE</span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-white">
                          {tx.referenceCode}
                        </span>
                      </div>
                    </td>

                    {/* Linked Bank */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{tx.bankName}</span>
                      </div>
                    </td>

                    {/* Sender */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{tx.senderName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.description}</div>
                    </td>

                    {/* Order Reference */}
                    <td className="py-3 px-4 font-mono text-cyan-300">
                      {tx.orderNumber ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {tx.orderNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500">Direct Deposit</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                      +${tx.amount.toFixed(2)}
                    </td>

                    {/* Verification Method */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {tx.verifiedBy === 'instant_api' ? '⚡ Instant Bank API' : '📡 Auto Webhook'}
                      </span>
                    </td>

                    {/* Cleared Timestamp */}
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {new Date(tx.verifiedAt || tx.createdAt).toLocaleDateString()} {new Date(tx.verifiedAt || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link Bank Modal */}
      {showLinkModal && (
        <LinkBankAccountModal
          dbState={dbState}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
};
