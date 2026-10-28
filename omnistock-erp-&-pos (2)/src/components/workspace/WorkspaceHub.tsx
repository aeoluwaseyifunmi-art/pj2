import React, { useState, useEffect } from 'react';
import { DatabaseState, dbStore } from '../../db/databaseStore';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser
} from '../../services/googleAuth';
import {
  DriveFile,
  listDriveFiles,
  uploadJsonToDrive,
  exportInventoryToGoogleSheets,
  exportSalesToGoogleSheets,
  GmailMessageItem,
  listRecentGmailMessages,
  sendEmailViaGmail,
  CalendarEvent,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  SheetCreationResult
} from '../../services/googleWorkspaceApi';
import { ConfirmationModal } from './ConfirmationModal';
import {
  FileSpreadsheet,
  Mail,
  Calendar,
  HardDrive,
  LogOut,
  ExternalLink,
  Plus,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building
} from 'lucide-react';
import { User } from 'firebase/auth';

interface WorkspaceHubProps {
  dbState: DatabaseState;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ dbState }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheets' | 'gmail' | 'calendar' | 'drive'>('sheets');

  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);

  // Sheets state
  const [createdSheets, setCreatedSheets] = useState<SheetCreationResult[]>([]);

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedOrderIdForEmail, setSelectedOrderIdForEmail] = useState<string>('');

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventSummary, setEventSummary] = useState('Inbound Container Delivery Dock 14');
  const [eventDescription, setEventDescription] = useState('Supplier shipment of specialty coffee and olive oil master cartons');
  const [eventStartTime, setEventStartTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [eventEndTime, setEventEndTime] = useState(
    new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [eventLocation, setEventLocation] = useState('CDC Dock 14, Chicago Logistics Center');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);

  // Confirmation Modal state for mutating operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: string[];
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {}
  });

  // Init auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch initial workspace data when token is available
  useEffect(() => {
    if (accessToken) {
      refreshData();
    }
  }, [accessToken, activeTab]);

  const refreshData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (activeTab === 'drive') {
        const files = await listDriveFiles(accessToken);
        setDriveFiles(files);
      } else if (activeTab === 'gmail') {
        const msgs = await listRecentGmailMessages(accessToken);
        setGmailMessages(msgs);
      } else if (activeTab === 'calendar') {
        const events = await listCalendarEvents(accessToken);
        setCalendarEvents(events);
      }
    } catch (e: any) {
      console.warn('Workspace load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setFeedback({
          type: 'success',
          message: `Connected successfully as ${res.user.displayName || res.user.email}!`
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Google authentication was cancelled or failed.'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setFeedback(null);
  };

  // -------------------------------------------------------------
  // GOOGLE SHEETS ACTIONS
  // -------------------------------------------------------------
  const handleExportInventoryToSheets = async () => {
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await exportInventoryToGoogleSheets(
        accessToken,
        dbState.products,
        dbState.inventory,
        dbState.locations
      );
      setCreatedSheets([res, ...createdSheets]);
      setFeedback({
        type: 'success',
        message: 'Live Inventory exported to Google Sheets!',
        link: res.spreadsheetUrl
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSalesToSheets = async () => {
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await exportSalesToGoogleSheets(accessToken, dbState.orders);
      setCreatedSheets([res, ...createdSheets]);
      setFeedback({
        type: 'success',
        message: 'Sales Transactions Ledger exported to Google Sheets!',
        link: res.spreadsheetUrl
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // GMAIL ACTIONS (Requires explicit confirmation)
  // -------------------------------------------------------------
  const handleSelectOrderForEmail = (orderId: string) => {
    setSelectedOrderIdForEmail(orderId);
    const order = dbState.orders.find((o) => o.id === orderId);
    if (order) {
      const cust = dbState.customers.find((c) => c.id === order.customerId);
      setEmailTo(cust?.email || 'customer@client.com');
      setEmailSubject(`OmniStock Invoice & Order Confirmation: ${order.orderNumber}`);

      const itemsHtml = order.items
        .map(
          (i) =>
            `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #ddd;">${i.name} (${i.sku})</td><td style="padding: 6px 12px; text-align: center; border-bottom: 1px solid #ddd;">${i.quantity}</td><td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #ddd;">$${i.subtotal.toFixed(2)}</td></tr>`
        )
        .join('');

      setEmailBody(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <h2 style="color: #0f172a; margin-bottom: 4px;">OmniStock Enterprise Statement</h2>
          <p style="color: #64748b; font-size: 13px;">Official order documentation for <strong>${order.orderNumber}</strong></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <table style="width: 100%; font-size: 13px; margin-bottom: 16px;">
            <tr><td><strong>Customer / Entity:</strong> ${order.customerCompany || order.customerName}</td><td style="text-align: right;"><strong>Channel:</strong> ${order.channel.toUpperCase()}</td></tr>
            <tr><td><strong>Facility Origin:</strong> ${order.locationName}</td><td style="text-align: right;"><strong>Payment:</strong> ${order.paymentMethod.replace(/_/g, ' ')} (${order.paymentStatus})</td></tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="background: #f1f5f9; text-align: left;"><th style="padding: 8px 12px;">Item</th><th style="padding: 8px 12px; text-align: center;">Qty</th><th style="padding: 8px 12px; text-align: right;">Total</th></tr>
            ${itemsHtml}
          </table>
          <div style="text-align: right; font-size: 14px; margin-top: 12px;">
            <p style="margin: 4px 0;">Subtotal: <strong>$${order.subtotal.toFixed(2)}</strong></p>
            <p style="margin: 4px 0; color: #16a34a;">Discounts: <strong>-$${order.discountTotal.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">Tax: <strong>$${order.taxTotal.toFixed(2)}</strong></p>
            <h3 style="margin: 8px 0; color: #0f172a; font-size: 18px;">Total Due: $${order.grandTotal.toFixed(2)}</h3>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Thank you for your business. For inquiries regarding this invoice, please reply directly to this email.
          </p>
        </div>
      `);
    }
  };

  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Sending Email via Gmail',
      description: `You are about to send an email from your authorized Gmail account (${currentUser?.email}) to the recipient below:`,
      details: [`Recipient: ${emailTo}`, `Subject: ${emailSubject}`],
      confirmLabel: 'Send Email Now',
      confirmVariant: 'primary',
      action: async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
          await sendEmailViaGmail(accessToken, emailTo, emailSubject, emailBody);
          setFeedback({
            type: 'success',
            message: `Email dispatched successfully to ${emailTo} via Gmail!`
          });
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
          setSelectedOrderIdForEmail('');
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message });
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // -------------------------------------------------------------
  // GOOGLE CALENDAR ACTIONS (Requires explicit confirmation)
  // -------------------------------------------------------------
  const handleRequestCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary || !eventStartTime || !eventEndTime) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Adding Event to Google Calendar',
      description: `This will schedule a logistics event directly on your primary Google Calendar:`,
      details: [
        `Summary: ${eventSummary}`,
        `Location: ${eventLocation}`,
        `Start: ${new Date(eventStartTime).toLocaleString()}`,
        `End: ${new Date(eventEndTime).toLocaleString()}`
      ],
      confirmLabel: 'Schedule on Google Calendar',
      confirmVariant: 'primary',
      action: async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
          const newEv = await createCalendarEvent(
            accessToken,
            eventSummary,
            eventDescription,
            new Date(eventStartTime).toISOString(),
            new Date(eventEndTime).toISOString(),
            eventLocation
          );
          setCalendarEvents([newEv, ...calendarEvents]);
          setFeedback({
            type: 'success',
            message: `Logistics event scheduled on your Google Calendar!`,
            link: newEv.htmlLink
          });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message });
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleRequestDeleteCalendarEvent = (eventId: string, summary: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Deleting Calendar Event',
      description: `Are you sure you want to permanently delete this event from your Google Calendar?`,
      details: [`Event: ${summary}`],
      confirmLabel: 'Delete Event',
      confirmVariant: 'danger',
      action: async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
          await deleteCalendarEvent(accessToken, eventId);
          setCalendarEvents(calendarEvents.filter((ev) => ev.id !== eventId));
          setFeedback({
            type: 'success',
            message: `Event "${summary}" removed from Google Calendar.`
          });
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message });
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // -------------------------------------------------------------
  // GOOGLE DRIVE ACTIONS
  // -------------------------------------------------------------
  const handleBackupDatabaseToDrive = async () => {
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      const fileName = `OmniStock_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const uploaded = await uploadJsonToDrive(accessToken, fileName, dbState);
      setDriveFiles([uploaded, ...driveFiles]);
      setFeedback({
        type: 'success',
        message: `Database backup uploaded to Google Drive as "${fileName}"!`,
        link: uploaded.webViewLink
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, render official "Sign in with Google" prompt
  if (!currentUser || !accessToken) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-6 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Connect Google Workspace
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              Connect your Google Workspace account to seamlessly sync inventory and sales data with{' '}
              <strong className="text-white">Google Sheets</strong>, dispatch B2B invoices and order receipts via{' '}
              <strong className="text-white">Gmail</strong>, manage logistics schedules on{' '}
              <strong className="text-white">Google Calendar</strong>, and archive database backups in{' '}
              <strong className="text-white">Google Drive</strong>.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded text-xs text-left max-w-md mx-auto ${
                feedback.type === 'error'
                  ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Official Google Material Sign-In Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm border border-slate-300 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-4 border-t border-slate-800 text-slate-400">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets</span>
              </p>
              <p className="text-[11px] leading-tight">Live inventory & sales spreadsheets</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Gmail</span>
              </p>
              <p className="text-[11px] leading-tight">Direct B2B invoices & customer receipts</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Calendar</span>
              </p>
              <p className="text-[11px] leading-tight">Dock receiving & restock delivery dates</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive</span>
              </p>
              <p className="text-[11px] leading-tight">Secure cloud JSON database backups</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Profile & Connection Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Google User'}
              className="w-10 h-10 rounded-full border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
              {currentUser.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{currentUser.displayName || 'Google Workspace User'}</p>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            title="Refresh Workspace Data"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Global Status/Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'error'
              ? 'bg-rose-950/80 border border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.link && (
            <a
              href={feedback.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-semibold underline text-white hover:text-emerald-300 shrink-0"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-md w-fit">
        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'sheets'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'gmail'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-blue-500" />
          <span>Gmail</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'calendar'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-500" />
          <span>Google Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'drive'
              ? 'bg-white text-slate-900 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-amber-500" />
          <span>Google Drive</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE SHEETS */}
      {activeTab === 'sheets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inventory to Sheets */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Live Inventory Master Sheet</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {dbState.products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Creates a formatted Google Sheet in your Drive containing all SKU details, barcodes, category, cost prices, retail prices, wholesale price breaks, physical counts across all 3 facilities, and cost/retail asset valuations.
              </p>
              <button
                onClick={handleExportInventoryToSheets}
                disabled={loading}
                className="w-full py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate & Sync Inventory Sheet</span>
              </button>
            </div>

            {/* Sales Ledger to Sheets */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Sales & POS Transactions Ledger</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {dbState.orders.length} Orders
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exports all retail register checkouts and B2B wholesale orders with customer details, payment tenders, tax breakdown, COGS, and gross profit directly into a new Google Spreadsheet.
              </p>
              <button
                onClick={handleExportSalesToSheets}
                disabled={loading}
                className="w-full py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate & Sync Sales Sheet</span>
              </button>
            </div>
          </div>

          {/* Created Spreadsheets List */}
          {createdSheets.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Recently Exported Google Sheets</h4>
              <div className="space-y-2">
                {createdSheets.map((sh, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-slate-200">Spreadsheet ID: {sh.spreadsheetId}</span>
                    </div>
                    <a
                      href={sh.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GMAIL */}
      {activeTab === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dispatch Email Form */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Send Invoice or Order Statement</h3>
              </div>
              <span className="text-[11px] text-slate-400">Via your Gmail account</span>
            </div>

            {/* Quick Template Selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Quick-Load Order Reference:</label>
              <select
                value={selectedOrderIdForEmail}
                onChange={(e) => handleSelectOrderForEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-hidden"
              >
                <option value="">-- Choose an order to auto-populate invoice --</option>
                {dbState.orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} · {o.customerCompany || o.customerName} (${o.grandTotal.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleRequestSendEmail} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Recipient Email:</label>
                <input
                  type="email"
                  placeholder="purchasing@clientcorp.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Subject Line:</label>
                <input
                  type="text"
                  placeholder="OmniStock Commercial Invoice / Statement"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Email Message (HTML / Text):</label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter invoice notes or customer correspondence..."
                  className="w-full p-2.5 bg-slate-950 font-mono text-[11px] border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !emailTo || !emailSubject}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-blue-400 hover:bg-blue-300 disabled:opacity-50 rounded shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Inbound / Outbound Correspondence */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Recent Gmail Correspondence</h3>
              <span className="text-[11px] font-mono text-slate-400">Order & Supplier Inquiries</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {gmailMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {loading ? 'Fetching messages from Gmail...' : 'No matching order correspondence found in inbox.'}
                </p>
              ) : (
                gmailMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-slate-950/70 rounded border border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-200 truncate">{msg.subject}</p>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{msg.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">From: {msg.from}</p>
                    <p className="text-[11px] text-slate-300 font-sans line-clamp-2">{msg.snippet}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Schedule Event Form */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Schedule Logistics Event</h3>
            </div>

            <form onSubmit={handleRequestCreateCalendarEvent} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Event Title:</label>
                <input
                  type="text"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Facility Location / Dock:</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Start Time:</label>
                <input
                  type="datetime-local"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">End Time:</label>
                <input
                  type="datetime-local"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Description / Cargo Notes:</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-xs font-bold text-slate-950 bg-purple-400 hover:bg-purple-300 disabled:opacity-50 rounded shadow-sm transition-colors"
              >
                Schedule on Google Calendar
              </button>
            </form>
          </div>

          {/* Scheduled Events List */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Upcoming Logistics & Receiving Schedule</h3>
              <span className="text-[11px] font-mono text-slate-400">Synced with Primary Calendar</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
              {calendarEvents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {loading ? 'Loading calendar events...' : 'No upcoming shipments or receiving events found.'}
                </p>
              ) : (
                calendarEvents.map((ev) => {
                  const startStr = ev.start.dateTime || ev.start.date || '';
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 bg-slate-950/70 rounded border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-100 text-sm">{ev.summary}</p>
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-purple-400"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span>{new Date(startStr).toLocaleString()}</span>
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <Building className="w-3 h-3 text-slate-500" />
                              <span>{ev.location}</span>
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-[11px] text-slate-400 font-sans pt-1">{ev.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleRequestDeleteCalendarEvent(ev.id, ev.summary)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete from Calendar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE DRIVE */}
      {activeTab === 'drive' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>OmniStock Cloud Backup to Google Drive</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Uploads an encrypted full database snapshot JSON containing all products, inventory balances, customers, orders, and movement audit logs into your Google Drive storage.
              </p>
            </div>

            <button
              onClick={handleBackupDatabaseToDrive}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Backup Database to Drive</span>
            </button>
          </div>

          {/* Drive Files List */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Recent Google Drive Storage Files
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {driveFiles.length} files listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-medium font-mono">
                  <tr>
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">MIME Type</th>
                    <th className="py-2.5 px-4">Last Modified</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {driveFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        {loading ? 'Loading files from Google Drive...' : 'No files found in Google Drive.'}
                      </td>
                    </tr>
                  ) : (
                    driveFiles.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-sm">{f.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{f.mimeType}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {f.webViewLink && (
                            <a
                              href={f.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                            >
                              <span>View in Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mutating Operations */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        details={confirmModal.details}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        isLoading={loading}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
