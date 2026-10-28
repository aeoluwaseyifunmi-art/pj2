import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Inputer, InputerRole, Location, InputerActivity, InputerActionType } from '../../types/database';
import { dbStore } from '../../db/databaseStore';
import {
  Users,
  Plus,
  Key,
  Printer,
  DollarSign,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  RefreshCw,
  QrCode,
  Activity,
  Radio,
  Clock,
  ShoppingBag,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface InputerManagementProps {
  onOpenTerminal?: (staffCode: string) => void;
}

export const InputerManagement: React.FC<InputerManagementProps> = ({ onOpenTerminal }) => {
  const [inputers, setInputers] = useState<Inputer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activities, setActivities] = useState<InputerActivity[]>([]);

  // Search & Filter for Inputers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time Activity Log state
  const [selectedStaffForLog, setSelectedStaffForLog] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const activitySectionRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInputer, setEditingInputer] = useState<Inputer | null>(null);
  const [showWebLinkModal, setShowWebLinkModal] = useState<Inputer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    staffCode: '',
    name: '',
    email: '',
    phone: '',
    pin: '',
    role: 'retail_inputer' as InputerRole,
    assignedLocationId: '',
    status: 'active' as 'active' | 'suspended'
  });

  const loadData = () => {
    const state = dbStore.getState();
    setInputers([...state.inputers]);
    setLocations([...state.locations]);
    setActivities([...(state.inputerActivities || [])]);
    if (!formData.assignedLocationId && state.locations.length > 0) {
      setFormData((prev) => ({ ...prev, assignedLocationId: state.locations[0].id }));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleOpenAddModal = () => {
    setEditingInputer(null);
    const existingCodes = inputers.map((i) => i.staffCode);
    const count = existingCodes.length + 1;
    const nextCode = `INP-${count < 10 ? '0' + count : count}`;

    setFormData({
      staffCode: nextCode,
      name: '',
      email: '',
      phone: '',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      role: 'retail_inputer',
      assignedLocationId: locations[0]?.id || 'loc_store_flagship',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inputer: Inputer) => {
    setEditingInputer(inputer);
    setFormData({
      staffCode: inputer.staffCode,
      name: inputer.name,
      email: inputer.email,
      phone: inputer.phone,
      pin: inputer.pin,
      role: inputer.role,
      assignedLocationId: inputer.assignedLocationId,
      status: inputer.status
    });
    setIsModalOpen(true);
  };

  const handleSaveInputer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.staffCode.trim() || !formData.pin.trim()) {
      alert('Please fill out Staff Code, Full Name, and a 4-digit PIN.');
      return;
    }

    if (editingInputer) {
      dbStore.updateInputer(editingInputer.id, {
        staffCode: formData.staffCode.toUpperCase().trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        pin: formData.pin.trim(),
        role: formData.role,
        assignedLocationId: formData.assignedLocationId,
        status: formData.status
      });
    } else {
      dbStore.addInputer({
        staffCode: formData.staffCode.toUpperCase().trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        pin: formData.pin.trim(),
        role: formData.role,
        assignedLocationId: formData.assignedLocationId,
        status: formData.status
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (inputer: Inputer) => {
    const nextStatus = inputer.status === 'active' ? 'suspended' : 'active';
    dbStore.updateInputer(inputer.id, { status: nextStatus });
  };

  const handleDeleteInputer = (inputer: Inputer) => {
    if (confirm(`Are you sure you want to remove staff inputer ${inputer.name} (${inputer.staffCode})?`)) {
      dbStore.deleteInputer(inputer.id);
    }
  };

  const getTerminalUrl = (staffCode: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('portal', 'inputer');
    url.searchParams.set('staffCode', staffCode);
    return url.toString();
  };

  const handleCopyLink = (staffCode: string, id: string) => {
    const url = getTerminalUrl(staffCode);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleFocusInputerLog = (staffCode: string) => {
    setSelectedStaffForLog(staffCode);
    if (activitySectionRef.current) {
      activitySectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Quick Action Simulation to demonstrate real-time audit logging
  const handleSimulateAction = (actionType: InputerActionType) => {
    const targetInputer =
      selectedStaffForLog === 'all'
        ? inputers[0]
        : inputers.find((i) => i.staffCode === selectedStaffForLog) || inputers[0];

    if (!targetInputer) return;

    const loc = locations.find((l) => l.id === targetInputer.assignedLocationId);

    if (actionType === 'login') {
      dbStore.recordInputerActivity({
        inputerId: targetInputer.staffCode,
        inputerName: targetInputer.name,
        actionType: 'login',
        title: 'Terminal Station Authenticated',
        description: `Staff PIN verified via quick web terminal pass`,
        locationId: targetInputer.assignedLocationId,
        locationName: loc?.name
      });
    } else if (actionType === 'sale_completed') {
      const randomTotal = Number((40 + Math.random() * 180).toFixed(2));
      const randomOrderNum = `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      dbStore.recordInputerActivity({
        inputerId: targetInputer.staffCode,
        inputerName: targetInputer.name,
        actionType: 'sale_completed',
        title: 'POS Sale Completed',
        description: `Completed express checkout for 2 items to Walk-in Retail Customer`,
        locationId: targetInputer.assignedLocationId,
        locationName: loc?.name,
        referenceNumber: randomOrderNum,
        amount: randomTotal
      });
    } else if (actionType === 'receipt_printed') {
      const randomOrderNum = `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      dbStore.recordInputerActivity({
        inputerId: targetInputer.staffCode,
        inputerName: targetInputer.name,
        actionType: 'receipt_printed',
        title: 'Thermal Receipt Printed',
        description: `Customer duplicate printed on 80mm thermal roll`,
        locationId: targetInputer.assignedLocationId,
        locationName: loc?.name,
        referenceNumber: randomOrderNum
      });
    } else if (actionType === 'stock_adjustment') {
      const refNum = `ADJ-${Math.floor(1000 + Math.random() * 9000)}`;
      dbStore.recordInputerActivity({
        inputerId: targetInputer.staffCode,
        inputerName: targetInputer.name,
        actionType: 'stock_adjustment',
        title: 'Inventory Stock Adjustment',
        description: `Floor inventory audit verified (+4 units Arcadia Coffee)`,
        locationId: targetInputer.assignedLocationId,
        locationName: loc?.name,
        referenceNumber: refNum
      });
    }
  };

  // Filtered Inputers for management table
  const filteredInputers = inputers.filter((inp) => {
    const matchQuery =
      inp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inp.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedRole === 'all' || inp.role === selectedRole;
    const matchLoc = selectedLocation === 'all' || inp.assignedLocationId === selectedLocation;
    return matchQuery && matchRole && matchLoc;
  });

  // Filtered Activity Logs for the active inputer (Last 10 Actions)
  const currentStaffLogs = useMemo(() => {
    let list = activities;
    if (selectedStaffForLog !== 'all') {
      list = list.filter(
        (a) =>
          a.inputerId.toUpperCase() === selectedStaffForLog.toUpperCase() ||
          a.inputerName.toUpperCase() === selectedStaffForLog.toUpperCase()
      );
    }
    if (selectedActionType !== 'all') {
      list = list.filter((a) => a.actionType === selectedActionType);
    }
    // Strict display of the last 10 actions performed
    return list.slice(0, 10);
  }, [activities, selectedStaffForLog, selectedActionType]);

  const activeInputerObject = useMemo(() => {
    if (selectedStaffForLog === 'all') return null;
    return inputers.find((i) => i.staffCode === selectedStaffForLog) || null;
  }, [inputers, selectedStaffForLog]);

  const totalReceiptsCount = inputers.reduce((sum, i) => sum + i.receiptsPrintedCount, 0);
  const totalVolume = inputers.reduce((sum, i) => sum + i.totalSalesVolume, 0);
  const activeCount = inputers.filter((i) => i.status === 'active').length;

  // Helper for action badges & icons
  const getActionDetails = (type: InputerActionType) => {
    switch (type) {
      case 'sale_completed':
        return {
          label: 'Sale Completed',
          icon: ShoppingBag,
          colorClass: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80',
          dotClass: 'bg-cyan-400'
        };
      case 'receipt_printed':
        return {
          label: 'Receipt Printed',
          icon: Printer,
          colorClass: 'text-purple-400 bg-purple-950/70 border-purple-800/80',
          dotClass: 'bg-purple-400'
        };
      case 'stock_adjustment':
        return {
          label: 'Stock Adjustment',
          icon: Package,
          colorClass: 'text-amber-400 bg-amber-950/70 border-amber-800/80',
          dotClass: 'bg-amber-400'
        };
      case 'login':
        return {
          label: 'Terminal Login',
          icon: Key,
          colorClass: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80',
          dotClass: 'bg-emerald-400'
        };
      case 'shift_opened':
      case 'shift_closed':
        return {
          label: type === 'shift_opened' ? 'Shift Opened' : 'Shift Closed',
          icon: Layers,
          colorClass: 'text-indigo-400 bg-indigo-950/70 border-indigo-800/80',
          dotClass: 'bg-indigo-400'
        };
      case 'pin_updated':
        return {
          label: 'PIN Updated',
          icon: ShieldCheck,
          colorClass: 'text-orange-400 bg-orange-950/70 border-orange-800/80',
          dotClass: 'bg-orange-400'
        };
      default:
        return {
          label: 'Action',
          icon: Activity,
          colorClass: 'text-slate-400 bg-slate-900 border-slate-700',
          dotClass: 'bg-slate-400'
        };
    }
  };

  const formatRelativeTime = (timestampStr: string) => {
    try {
      const now = new Date();
      const date = new Date(timestampStr);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return timestampStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff Inputer Management</h1>
            <span className="text-xs bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2.5 py-0.5 rounded font-mono">
              Web Terminal & Real-Time Audit
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Oversee staff credentials, live receipt counts, direct web links, and monitor real-time audit activity logs for each individual inputer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Inputer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Staff Inputers</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {activeCount} <span className="text-xs font-normal text-slate-400">/ {inputers.length} total</span>
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Authorized for Web Terminal</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Receipts Printed</span>
            <Printer className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{totalReceiptsCount}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Thermal register slips</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Processed by operators</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Activity Stream</span>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{activities.length}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Live actions logged</p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* REAL-TIME ACTIVITY LOG (LAST 10 ACTIONS PER INDIVIDUAL INPUTER)     */}
      {/* ==================================================================== */}
      <div
        ref={activitySectionRef}
        className="bg-slate-900 border border-cyan-900/60 rounded-xl overflow-hidden shadow-xl"
      >
        {/* Section Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Real-Time Activity Log</span>
                <span className="text-xs font-mono font-normal bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded">
                  Last 10 Actions
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeInputerObject ? (
                <span>
                  Viewing last 10 actions performed by{' '}
                  <strong className="text-white">{activeInputerObject.name}</strong> (
                  <span className="text-cyan-400 font-mono">{activeInputerObject.staffCode}</span>)
                </span>
              ) : (
                'Live audit stream of POS logins, completed sales, receipt prints, and stock adjustments across all staff inputers.'
              )}
            </p>
          </div>

          {/* Quick Simulation Buttons to demonstrate live real-time stream */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Simulate Live:</span>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleSimulateAction('sale_completed')}
                title="Simulate a POS sale completed by selected inputer"
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3 h-3 text-cyan-400" />
                <span>+ Sale</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateAction('receipt_printed')}
                title="Simulate thermal receipt printing"
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
              >
                <Printer className="w-3 h-3 text-purple-400" />
                <span>+ Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateAction('stock_adjustment')}
                title="Simulate stock adjustment action"
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
              >
                <Package className="w-3 h-3 text-amber-400" />
                <span>+ Stock Adj</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateAction('login')}
                title="Simulate terminal login"
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
              >
                <Key className="w-3 h-3 text-emerald-400" />
                <span>+ Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Staff Switcher: Pick Individual Inputer to see their exact 10 actions */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Select Inputer:
            </span>
            <button
              onClick={() => setSelectedStaffForLog('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedStaffForLog === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Staff Combined ({activities.length})
            </button>

            {inputers.map((inp) => {
              const staffActionCount = activities.filter(
                (a) => a.inputerId.toUpperCase() === inp.staffCode.toUpperCase()
              ).length;
              const isSelected = selectedStaffForLog === inp.staffCode;

              return (
                <button
                  key={inp.id}
                  onClick={() => setSelectedStaffForLog(inp.staffCode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono">{inp.staffCode}</span>
                  <span>{inp.name}</span>
                  <span
                    className={`font-mono text-xs px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-slate-950/30 text-slate-900 font-extrabold'
                        : 'bg-slate-950 text-cyan-400 border border-slate-800'
                    }`}
                  >
                    {staffActionCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Action:</span>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Action Types</option>
              <option value="sale_completed">Sales Completed</option>
              <option value="receipt_printed">Receipts Printed</option>
              <option value="stock_adjustment">Stock Adjustments</option>
              <option value="login">Terminal Logins</option>
              <option value="shift_opened">Shift Events</option>
            </select>
          </div>
        </div>

        {/* Activity Items List (Last 10 Actions Display) */}
        <div className="divide-y divide-slate-800/60 max-h-[480px] overflow-y-auto font-sans">
          {currentStaffLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">No actions recorded for this filter criteria.</p>
              <p className="text-xs text-slate-400">
                Use the simulation buttons above or perform a sale in the Web Terminal to generate live audit logs.
              </p>
            </div>
          ) : (
            currentStaffLogs.map((act, index) => {
              const details = getActionDetails(act.actionType);
              const IconComponent = details.icon;

              return (
                <div
                  key={act.id}
                  className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Icon, Badge, Description */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${details.colorClass}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white">{act.title}</span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded border font-mono font-medium ${details.colorClass}`}
                        >
                          {details.label}
                        </span>

                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {act.inputerId} · {act.inputerName}
                        </span>

                        {act.locationName && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {act.locationName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {act.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-slate-400 font-mono">
                        {act.referenceNumber && (
                          <span className="text-slate-400 font-bold">
                            Ref: <span className="text-white">{act.referenceNumber}</span>
                          </span>
                        )}
                        <span className="text-slate-400">●</span>
                        <span className="text-slate-400">
                          {new Date(act.timestamp).toLocaleString()} ({formatRelativeTime(act.timestamp)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount or Action Index */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                    {act.amount !== undefined && (
                      <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                        +${act.amount.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-400">
                      Action #{index + 1} of 10
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Streaming live from store registers & Firestore audit collection `/inputer_activities`</span>
          </div>
          <span>Showing latest 10 sequential events</span>
        </div>
      </div>

      {/* Filter and Search Bar for Inputers */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, staff code (e.g. INP-01), or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Roles</option>
              <option value="retail_inputer">Retail Inputer</option>
              <option value="wholesale_inputer">Wholesale Inputer</option>
              <option value="senior_cashier">Senior Cashier</option>
              <option value="shift_supervisor">Shift Supervisor</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inputers List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Registered Staff Inputers ({filteredInputers.length})
          </h2>
          <span className="text-xs text-slate-400">Click "View Log" on any inputer to filter their 10 actions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Staff Code / Name</th>
                <th className="py-3 px-4">Role & Location</th>
                <th className="py-3 px-4">PIN / Security</th>
                <th className="py-3 px-4 text-center">Receipts Printed</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Web Link & Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInputers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No inputers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInputers.map((inputer) => {
                  const loc = locations.find((l) => l.id === inputer.assignedLocationId);
                  const isCopied = copiedId === inputer.id;
                  const isCurrentlyLogged = selectedStaffForLog === inputer.staffCode;

                  return (
                    <tr
                      key={inputer.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentlyLogged ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-mono font-bold text-xs">
                            {inputer.staffCode.replace('INP-', '')}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {inputer.name}
                              <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                {inputer.staffCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">{inputer.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-200 capitalize">
                          {inputer.role.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{loc?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span className="tracking-widest">•••• ({inputer.pin})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                          <Printer className="w-3 h-3" />
                          <span>{inputer.receiptsPrintedCount}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-emerald-400 font-semibold">
                        ${inputer.totalSalesVolume.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {inputer.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Filter Activity Log Button */}
                          <button
                            onClick={() => handleFocusInputerLog(inputer.staffCode)}
                            title="View Last 10 Actions in Real-Time Log"
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                              isCurrentlyLogged
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>10 Actions</span>
                          </button>

                          {/* Copy Web Link Button */}
                          <button
                            onClick={() => handleCopyLink(inputer.staffCode, inputer.id)}
                            title="Copy Web Terminal Direct Link"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Link'}</span>
                          </button>

                          {/* Open Terminal Directly */}
                          <button
                            onClick={() => {
                              if (onOpenTerminal) {
                                onOpenTerminal(inputer.staffCode);
                              } else {
                                window.open(getTerminalUrl(inputer.staffCode), '_blank');
                              }
                            }}
                            title="Open Inputer Terminal"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Show QR / Link modal */}
                          <button
                            onClick={() => setShowWebLinkModal(inputer)}
                            title="View Link Details"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(inputer)}
                            title="Edit Inputer"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active/Suspended */}
                          <button
                            onClick={() => handleToggleStatus(inputer)}
                            title={inputer.status === 'active' ? 'Suspend Staff' : 'Reactivate Staff'}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              inputer.status === 'active'
                                ? 'text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/80'
                                : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80'
                            }`}
                          >
                            {inputer.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteInputer(inputer)}
                            title="Delete Inputer"
                            className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inputer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full text-slate-200 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                {editingInputer ? `Edit Staff Inputer: ${editingInputer.staffCode}` : 'Add New Staff Inputer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInputer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Staff Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffCode}
                    onChange={(e) => setFormData({ ...formData, staffCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. INP-04"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    4-Digit POS PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="4-digit PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alexander Wright"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@omnistock.internal"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as InputerRole })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="retail_inputer">Retail Inputer</option>
                    <option value="wholesale_inputer">Wholesale Inputer</option>
                    <option value="senior_cashier">Senior Cashier</option>
                    <option value="shift_supervisor">Shift Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Assigned Store / Facility
                  </label>
                  <select
                    value={formData.assignedLocationId}
                    onChange={(e) => setFormData({ ...formData, assignedLocationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                      className="text-cyan-500 focus:ring-0"
                    />
                    <span>Active (Allowed to sign in & print receipts)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'suspended'}
                      onChange={() => setFormData({ ...formData, status: 'suspended' })}
                      className="text-rose-500 focus:ring-0"
                    />
                    <span className="text-rose-400">Suspended</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded shadow transition-colors cursor-pointer"
                >
                  {editingInputer ? 'Save Changes' : 'Create Inputer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Web Link QR & Details Modal */}
      {showWebLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full text-slate-200 overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Direct Web Terminal Link</h3>
              </div>
              <button
                onClick={() => setShowWebLinkModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Staff inputer <strong className="text-white">{showWebLinkModal.name}</strong> can open this link on any web browser, tablet, or smartphone terminal to begin entering POS sales and printing receipts immediately:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
                <div className="text-xs text-slate-400 font-mono">Web Terminal Link:</div>
                <div className="bg-slate-900 p-2 rounded text-xs font-mono text-cyan-400 break-all border border-slate-800">
                  {getTerminalUrl(showWebLinkModal.staffCode)}
                </div>
                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <span>Assigned Staff PIN: <strong className="text-amber-400 font-mono">{showWebLinkModal.pin}</strong></span>
                  <button
                    onClick={() => handleCopyLink(showWebLinkModal.staffCode, showWebLinkModal.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans font-medium text-xs transition-colors cursor-pointer"
                  >
                    {copiedId === showWebLinkModal.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === showWebLinkModal.id ? 'Copied URL!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Terminal Features for {showWebLinkModal.name}:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Direct access without navigating the admin ERP dashboard</li>
                  <li>Instant physical receipt print with 80mm thermal receipt styling</li>
                  <li>Instant reprint access to recently processed receipts</li>
                  <li>Real-time inventory deduction & shifts tracking</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWebLinkModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
