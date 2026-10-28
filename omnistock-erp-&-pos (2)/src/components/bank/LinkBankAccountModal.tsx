import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Building2, X, Check, ShieldCheck, Landmark, AlertCircle, ArrowRight } from 'lucide-react';

interface LinkBankAccountModalProps {
  dbState: DatabaseState;
  onClose: () => void;
  onAccountLinked?: (bankId: string) => void;
}

export const LinkBankAccountModal: React.FC<LinkBankAccountModalProps> = ({
  dbState,
  onClose,
  onAccountLinked
}) => {
  const [bankName, setBankName] = useState('JPMorgan Chase Bank');
  const [customBankName, setCustomBankName] = useState('');
  const [accountName, setAccountName] = useState('OmniStock Merchant Settlement');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('071000013');
  const [swiftBic, setSwiftBic] = useState('CHASUS33');
  const [accountType, setAccountType] = useState<'merchant_settlement' | 'checking' | 'savings'>('merchant_settlement');
  const [currency, setCurrency] = useState('USD');
  const [isDefault, setIsDefault] = useState((dbState?.linkedBankAccounts?.length || 0) === 0);
  const [autoVerifyIncoming, setAutoVerifyIncoming] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStep, setSuccessStep] = useState(false);

  const bankPresets = [
    { name: 'JPMorgan Chase Bank', routing: '071000013', swift: 'CHASUS33' },
    { name: 'Bank of America', routing: '026009593', swift: 'BOFAUS3N' },
    { name: 'Wells Fargo', routing: '121000247', swift: 'WFBIUS6S' },
    { name: 'Citibank N.A.', routing: '021000089', swift: 'CITIUS33' },
    { name: 'Barclays Bank', routing: '200000', swift: 'BARCGB22' },
    { name: 'HSBC Commercial', routing: '021001088', swift: 'HSBCUS33' },
    { name: 'Monzo Business', routing: '040004', swift: 'MONZGB2L' },
    { name: 'Other Financial Institution', routing: '', swift: '' }
  ];

  const handleSelectPreset = (preset: typeof bankPresets[0]) => {
    setBankName(preset.name);
    if (preset.routing) setRoutingNumber(preset.routing);
    if (preset.swift) setSwiftBic(preset.swift);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBank = bankName === 'Other Financial Institution' ? customBankName.trim() : bankName;

    if (!finalBank) {
      setErrorMessage('Please select or specify your bank name');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMessage('Please provide your bank account or IBAN number');
      return;
    }
    if (!accountName.trim()) {
      setErrorMessage('Please provide an account holder or display name');
      return;
    }

    setIsConnecting(true);
    setErrorMessage(null);

    // Simulate instant bank handshake & verification
    setTimeout(() => {
      // Mask account number for security: show last 4 digits
      const rawAcc = accountNumber.trim().replace(/\s+/g, '');
      const maskedAcc = rawAcc.length > 4 ? `•••• ${rawAcc.slice(-4)}` : `•••• ${rawAcc}`;

      const created = dbStore.addLinkedBankAccount({
        bankName: finalBank,
        accountName: accountName.trim(),
        accountNumber: maskedAcc,
        routingNumber: routingNumber.trim() || undefined,
        swiftBic: swiftBic.trim() || undefined,
        accountType,
        currency,
        isDefault,
        status: 'active',
        balance: 25000.00, // initial buffer balance
        autoVerifyIncoming
      });

      setIsConnecting(false);
      setSuccessStep(true);

      setTimeout(() => {
        if (onAccountLinked) {
          onAccountLinked(created.id);
        }
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 text-slate-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-serif">
                Link Settlement Bank Account
              </h2>
              <p className="text-xs text-slate-400">
                Connect your business bank account to auto-verify customer transfers and receive settlements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successStep ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Bank Successfully Linked & Verified</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {bankName === 'Other Financial Institution' ? customBankName : bankName} is now active for instant payment verification and automatic ledger settlements.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Quick Bank Presets */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-xs">
                Select Your Bank Institution
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bankPresets.slice(0, 8).map((preset) => {
                  const isSelected = bankName === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-medium text-[11px] leading-tight line-clamp-1">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Other Institution */}
            {bankName === 'Other Financial Institution' && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  Financial Institution Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Bank, Standard Chartered, First National..."
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  Account Name / Holder
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OmniStock Operations LLC"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  Account Number / IBAN
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1029384756"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Routing / Sort Code & Swift */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  Routing / Sort Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 071000013"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHASUS33"
                  value={swiftBic}
                  onChange={(e) => setSwiftBic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">
                  Account Purpose
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="merchant_settlement">Merchant Settlement</option>
                  <option value="checking">Operating Checking</option>
                  <option value="savings">Reserve Savings</option>
                </select>
              </div>
            </div>

            {/* Auto-verification Toggles */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoVerifyIncoming}
                  onChange={(e) => setAutoVerifyIncoming(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">
                    Enable Real-time Auto-Verification for Bank Transfers
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Automatically verifies incoming bank payments against order settlement reference codes and marks transactions as DONE in the ledger.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-slate-800/60">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-300 text-xs">
                  Set as primary settlement bank for POS and Wholesale registers
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit Encrypted Bank Network Connection</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Bank...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Link & Verify Bank</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
