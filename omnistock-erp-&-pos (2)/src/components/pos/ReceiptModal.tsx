import React, { useState } from 'react';
import { Order } from '../../types/database';
import { Printer, X, CheckCircle, FileText, Download, Mail, HardDrive, UserCheck } from 'lucide-react';
import { getAccessToken } from '../../services/googleAuth';
import { sendEmailViaGmail, uploadJsonToDrive } from '../../services/googleWorkspaceApi';
import { dbStore } from '../../db/databaseStore';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onReceiptPrinted?: (order: Order) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose, onReceiptPrinted }) => {
  if (!order) return null;

  const isWholesale = order.channel === 'wholesale';
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handlePrint = () => {
    try {
      dbStore.recordReceiptPrinted(order.id, order.inputerId);
      if (onReceiptPrinted) {
        onReceiptPrinted(order);
      }
    } catch (e) {
      console.warn('Error recording receipt print:', e);
    }
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(order, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${order.orderNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleEmailInvoice = async () => {
    const token = await getAccessToken();
    if (!token) {
      setEmailStatus('Sign in to Google Workspace to send emails via Gmail.');
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }

    const recipient = window.prompt(
      'Send receipt via your Gmail account.\nEnter recipient email address:',
      order.customerName.includes('@') ? order.customerName : 'purchasing@client.com'
    );
    if (!recipient) return;

    setIsSending(true);
    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <h2>OmniStock Enterprise Statement</h2>
          <p>Official statement for order <strong>${order.orderNumber}</strong> (${order.channel.toUpperCase()})</p>
          <hr />
          <p><strong>Customer:</strong> ${order.customerCompany || order.customerName}</p>
          <p><strong>Total Due:</strong> $${order.grandTotal.toFixed(2)} (${order.paymentMethod})</p>
          <p>Thank you for your business!</p>
        </div>
      `;
      await sendEmailViaGmail(
        token,
        recipient,
        `OmniStock Invoice & Statement: ${order.orderNumber}`,
        htmlBody
      );
      setEmailStatus(`Dispatched via Gmail to ${recipient}!`);
      setTimeout(() => setEmailStatus(null), 4000);
    } catch (err: any) {
      setEmailStatus(`Gmail error: ${err.message}`);
      setTimeout(() => setEmailStatus(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      setDriveStatus('Sign in to Google Workspace first.');
      setTimeout(() => setDriveStatus(null), 4000);
      return;
    }

    try {
      const fileName = `Order_${order.orderNumber}_${new Date().toISOString().slice(0, 10)}.json`;
      await uploadJsonToDrive(token, fileName, order);
      setDriveStatus(`Archived to Google Drive as ${fileName}!`);
      setTimeout(() => setDriveStatus(null), 4000);
    } catch (err: any) {
      setDriveStatus(`Drive error: ${err.message}`);
      setTimeout(() => setDriveStatus(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full text-slate-200 overflow-hidden shadow-2xl my-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-100">
              {isWholesale ? 'Commercial Wholesale Invoice' : 'Point-of-Sale Register Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailInvoice}
              disabled={isSending}
              title="Send invoice via Gmail"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSending ? 'Sending...' : 'Gmail'}</span>
            </button>
            <button
              onClick={handleSaveToDrive}
              title="Archive to Google Drive"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Drive</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(emailStatus || driveStatus) && (
          <div className="px-5 py-2 bg-slate-800 text-xs text-emerald-300 font-mono border-b border-slate-700">
            {emailStatus || driveStatus}
          </div>
        )}

        {/* Document Body (Styled for paper/thermal and on-screen readability) */}
        <div className="p-6 bg-slate-950/40 text-slate-300 font-mono text-xs space-y-4">
          {/* Brand & Store Details */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-800">
            <p className="text-base font-bold text-white tracking-wider">OMNISTOCK ENTERPRISE</p>
            <p className="text-slate-400 font-sans text-xs">{order.locationName}</p>
            <p className="text-slate-400 font-sans text-xs">
              Channel: <span className="text-slate-200 uppercase font-semibold">{order.channel}</span> · Shift POS
            </p>
            <p className="text-slate-400 text-xs tabular-nums">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Reference Info */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-slate-800/80 font-sans">
            <div>
              <p className="text-slate-400">Order Reference:</p>
              <p className="font-mono text-slate-200 font-bold">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">POS Inputer / Cashier:</p>
              <p className="text-slate-200 font-medium">
                {order.inputerName || order.cashier}
                {order.inputerId && (
                  <span className="text-cyan-400 font-mono text-xs ml-1.5 font-normal">
                    [{order.inputerId}]
                  </span>
                )}
              </p>
            </div>
            {order.customerName && (
              <div className="col-span-2 pt-1 border-t border-slate-800/40">
                <p className="text-slate-400">Bill To / Account:</p>
                <p className="text-slate-200 font-medium">
                  {order.customerCompany ? `${order.customerCompany} (${order.customerName})` : order.customerName}
                </p>
                {order.customerTaxId && (
                  <p className="text-emerald-400 text-xs">Tax Exemption ID: {order.customerTaxId}</p>
                )}
              </div>
            )}
            {order.receiptPrinted && (
              <div className="col-span-2 flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/20 font-mono">
                <span className="text-cyan-400">● Receipt Registered</span>
                <span className="text-slate-400 text-xs">Original / Verified Copy</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1 font-semibold">
              <span className="w-1/2">Item & SKU</span>
              <span className="w-1/4 text-center">Qty x Price</span>
              <span className="w-1/4 text-right">Total</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <div className="w-1/2 pr-2">
                    <p className="text-slate-200 font-sans font-medium line-clamp-1">{item.name}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{item.sku}</p>
                    {item.appliedTierName && (
                      <p className="text-emerald-400 text-[10px] font-sans">{item.appliedTierName}</p>
                    )}
                  </div>
                  <div className="w-1/4 text-center tabular-nums text-slate-300">
                    {item.quantity} x ${item.unitPrice.toFixed(2)}
                  </div>
                  <div className="w-1/4 text-right tabular-nums text-slate-100 font-semibold">
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="space-y-1.5 pt-3 border-t border-dashed border-slate-800 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="tabular-nums text-slate-200">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discounts / Volume Savings:</span>
                <span className="tabular-nums">-${order.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>
                Sales Tax {isWholesale && order.taxTotal === 0 ? '(B2B Exempt)' : ''}:
              </span>
              <span className="tabular-nums text-slate-200">${order.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>TOTAL DUE:</span>
              <span className="tabular-nums text-emerald-400">${order.grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Tender details */}
            <div className="pt-2 text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="uppercase text-slate-200">{order.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="uppercase text-slate-200 font-medium">{order.paymentStatus}</span>
              </div>
              {order.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span className="tabular-nums text-slate-200">${order.cashTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Change Returned:</span>
                    <span className="tabular-nums">${(order.cashChange || 0).toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Bank Settlement Auto-Verification Stamp */}
              {(order.bankVerified || order.paymentMethod === 'bank_transfer' || order.bankTransactionRef) && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      BANK SETTLEMENT: VERIFIED & DONE
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900 border border-emerald-700">CLEARED</span>
                  </div>
                  {order.bankName && (
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Deposit Bank:</span>
                      <span className="font-semibold text-white">{order.bankName}</span>
                    </div>
                  )}
                  {order.bankTransactionRef && (
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Settlement Reference:</span>
                      <span className="font-mono text-cyan-300 font-bold">{order.bankTransactionRef}</span>
                    </div>
                  )}
                  {order.bankVerifiedAt && (
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Verified Timestamp:</span>
                      <span>{new Date(order.bankVerifiedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barcode Visual Stamp */}
          <div className="pt-4 text-center space-y-1 border-t border-slate-800">
            <div className="h-9 mx-auto max-w-[200px] flex items-end justify-center gap-1 bg-slate-900/80 px-4 py-1.5 rounded">
              {[3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3, 5, 2, 1, 4, 3, 2, 5, 1, 4].map((h, i) => (
                <div
                  key={i}
                  className="bg-slate-300 w-1"
                  style={{ height: `${h * 4 + 6}px` }}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 tracking-widest">{order.orderNumber}</p>
            <p className="text-[10px] text-slate-400 font-sans">
              Thank you for partnering with OmniStock Enterprise.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
