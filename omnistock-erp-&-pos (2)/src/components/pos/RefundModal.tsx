import React, { useState } from 'react';
import { Order } from '../../types/database';
import { dbStore } from '../../db/databaseStore';
import { RotateCcw, AlertTriangle, CheckCircle2, Package } from 'lucide-react';

interface RefundModalProps {
  order: Order;
  onClose: () => void;
  onRefundCompleted?: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  order,
  onClose,
  onRefundCompleted
}) => {
  const [refundAmount, setRefundAmount] = useState<number>(order.grandTotal);
  const [refundReason, setRefundReason] = useState<string>('Customer return / exchange');
  const [restockItems, setRestockItems] = useState<boolean>(true);
  const [operator, setOperator] = useState<string>('Senior Cashier');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refundAmount <= 0 || refundAmount > order.grandTotal) {
      alert(`Refund amount must be between $0.01 and $${order.grandTotal.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    const result = dbStore.processOrderRefund(
      order.id,
      refundAmount,
      refundReason,
      restockItems,
      operator
    );

    alert(result.message);
    setIsSubmitting(false);
    if (onRefundCompleted) onRefundCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white">Process Order Refund & Return</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Order Summary Pill */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-white font-bold">{order.orderNumber}</span>
              <span className="font-mono text-emerald-400 font-bold">${order.grandTotal.toFixed(2)}</span>
            </div>
            <div className="text-slate-400 text-[11px] flex justify-between">
              <span>Customer: {order.customerName}</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Refund Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={order.grandTotal}
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500">
              Max refundable: ${order.grandTotal.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Reason for Return *</label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Customer return / exchange">Customer return / exchange</option>
              <option value="Defective or damaged product">Defective or damaged product</option>
              <option value="Overcharged / Price dispute">Overcharged / Price dispute</option>
              <option value="Order cancelled prior to shipment">Order cancelled prior to shipment</option>
              <option value="Wholesale transit shortage">Wholesale transit shortage</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Authorizing Operator</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Restock items checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={restockItems}
              onChange={(e) => setRestockItems(e.target.checked)}
              className="mt-0.5 rounded text-rose-500 focus:ring-rose-500"
            />
            <div>
              <span className="font-semibold text-slate-200 block">Restock items to inventory ledger</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Automatically increments stock quantity at {order.locationName} and writes a return movement record.
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Authorize Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
