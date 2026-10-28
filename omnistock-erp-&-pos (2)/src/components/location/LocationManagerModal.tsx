import React, { useState } from 'react';
import { dbStore, DatabaseState } from '../../db/databaseStore';
import { Location, LocationType } from '../../types/database';
import {
  MapPin,
  Building2,
  Warehouse,
  Store,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';

interface LocationManagerModalProps {
  dbState: DatabaseState;
  activeLocationId: string;
  onSelectActiveLocation: (locationId: string) => void;
  onClose: () => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  dbState,
  activeLocationId,
  onSelectActiveLocation,
  onClose
}) => {
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for adding or editing
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<LocationType>('retail_store');
  const [address, setAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startEdit = (loc: Location) => {
    setEditingLocation(loc);
    setName(loc.name);
    setCode(loc.code);
    setType(loc.type);
    setAddress(loc.address);
    setIsPrimary(loc.isPrimary);
    setIsAddingNew(false);
    setErrorMessage(null);
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingLocation(null);
    setName('');
    setCode(`LOC-0${dbState.locations.length + 1}`);
    setType('retail_store');
    setAddress('');
    setIsPrimary(false);
    setErrorMessage(null);
  };

  const cancelForm = () => {
    setEditingLocation(null);
    setIsAddingNew(false);
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMessage('Location Name and Code are required.');
      return;
    }

    if (isAddingNew) {
      const created = dbStore.addLocation({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        address: address.trim() || 'No address specified',
        isPrimary
      });
      onSelectActiveLocation(created.id);
      setIsAddingNew(false);
    } else if (editingLocation) {
      dbStore.updateLocation(editingLocation.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        address: address.trim() || 'No address specified',
        isPrimary
      });
      setEditingLocation(null);
    }
  };

  const handleDelete = (locationId: string) => {
    if (dbState.locations.length <= 1) {
      alert('You cannot delete your only location.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this location?')) {
      dbStore.deleteLocation(locationId);
      if (activeLocationId === locationId) {
        const remaining = dbStore.getState().locations;
        if (remaining[0]) {
          onSelectActiveLocation(remaining[0].id);
        }
      }
    }
  };

  const getTypeIcon = (locType: LocationType) => {
    switch (locType) {
      case 'warehouse':
        return <Warehouse className="w-4 h-4 text-cyan-400" />;
      case 'retail_store':
        return <Store className="w-4 h-4 text-emerald-400" />;
      case 'distribution_center':
      default:
        return <Building2 className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeLabel = (locType: LocationType) => {
    switch (locType) {
      case 'warehouse':
        return 'Warehouse Facility';
      case 'retail_store':
        return 'Retail Store Branch';
      case 'distribution_center':
      default:
        return 'Distribution Center';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 text-slate-200 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Store & Warehouse Locations
              </h2>
              <p className="text-xs text-slate-400">
                Change your active location, edit branch details, or add new stores
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

        {/* Form when adding or editing */}
        {(isAddingNew || editingLocation) && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {isAddingNew ? 'Add New Location / Branch' : `Edit: ${editingLocation?.name}`}
              </h3>
              <button
                type="button"
                onClick={cancelForm}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westside Retail Outlet, Main Distribution Warehouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Branch Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STORE-02, CDC-03"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Facility Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LocationType)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                >
                  <option value="retail_store">Retail Store</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="distribution_center">Distribution Center</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 1024 Broadway Ave, Chicago, IL"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryCheckbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500"
              />
              <label htmlFor="isPrimaryCheckbox" className="text-xs text-slate-300 cursor-pointer">
                Set as Primary Company Headquarters / Main Warehouse
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Location</span>
              </button>
            </div>
          </form>
        )}

        {/* Location List Header & Add Button */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Available Locations ({dbState.locations.length})
          </span>
          {!isAddingNew && !editingLocation && (
            <button
              onClick={startAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New Location</span>
            </button>
          )}
        </div>

        {/* Location Cards */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {dbState.locations.map((loc) => {
            const isActive = loc.id === activeLocationId;
            return (
              <div
                key={loc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-slate-950/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        {getTypeIcon(loc.type)}
                      </div>
                      <span className="font-bold text-white text-sm tracking-tight">{loc.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {loc.code}
                      </span>
                      {loc.isPrimary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                          PRIMARY
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ACTIVE LOCATION
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{getTypeLabel(loc.type)}</span>
                      <span>·</span>
                      <span className="truncate max-w-sm">{loc.address}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive ? (
                      <button
                        onClick={() => {
                          onSelectActiveLocation(loc.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Switch Here</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    )}

                    <button
                      onClick={() => startEdit(loc)}
                      title="Edit this location"
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {dbState.locations.length > 1 && (
                      <button
                        onClick={() => handleDelete(loc.id)}
                        title="Delete this location"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Active location applies to POS sales, stock deductions, and receipts.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
