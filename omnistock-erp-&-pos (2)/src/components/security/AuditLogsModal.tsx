import React, { useState } from 'react';
import { DatabaseState, dbStore } from '../../db/databaseStore';
import { AuditLogEntry } from '../../types/database';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { exportToCsv, exportToExcel } from '../../utils/exportUtils';

interface AuditLogsModalProps {
  dbState: DatabaseState;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ dbState, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'audit' | 'backup' | 'roles'>('audit');

  const auditLogs = dbState.auditLogs || [];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleExportBackup = () => {
    const jsonStr = dbStore.exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniStock_ERP_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = dbStore.importDatabaseBackup(content);
        alert(result.message);
      } catch (err: any) {
        alert(`Failed to read file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Enterprise Security, Audit Trail & System Backups
              </h2>
              <p className="text-[11px] text-slate-400">
                Immutable transaction logs, tamper-proof state exports, and role-based permissions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Backup & Restore
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Role-Based Access (RBAC)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search actor, action, or entity..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      exportToCsv(
                        `OmniStock_Audit_Logs_${new Date().toISOString().slice(0, 10)}`,
                        filteredLogs
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      exportToExcel(
                        `OmniStock_Audit_Logs_${new Date().toISOString().slice(0, 10)}`,
                        'Audit Trail',
                        filteredLogs
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Operator / Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}{' '}
                          <span className="text-[10px] text-slate-600">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-white">{log.actorName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.role}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-emerald-300 border border-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                          {log.entityId}
                        </td>
                        <td className="py-2 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              {/* Export Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Export Full Database Backup</h3>
                    <p className="text-xs text-slate-400">
                      Creates a JSON snapshot of all products, inventory, orders, customers, and bank settings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              {/* Import Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Restore Database From File</h3>
                    <p className="text-xs text-slate-400">
                      Upload an existing OmniStock JSON backup file to overwrite or restore system state.
                    </p>
                  </div>
                </div>
                <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Select Backup File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">1. System Administrator</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-mono">
                      Full Access
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Unrestricted access to ERP configuration, AI insights, purchase orders, price tiers, bank accounts, and audit recovery.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">2. Shift Supervisor</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-400 font-mono">
                      Operational
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Can authorize refunds, open/close register shifts, approve purchase order intakes, and audit daily cashier float variances.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">3. Senior Cashier</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 font-mono">
                      POS & Receipts
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Point of sale register access, tendered cash/card payments, customer receipt printing, and verified bank transfers.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">4. Dedicated Inputer</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 font-mono">
                      Restricted Terminal
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Simplified web terminal mode secured with 4-digit PIN. Can only record item sales and print numbered receipts without seeing system profits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
