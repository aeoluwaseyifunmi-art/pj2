import { Product, InventoryLevel, Location, Order } from '../types/database';

// Helper to encode UTF-8 string to base64url for Gmail API
function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// -------------------------------------------------------------
// GOOGLE DRIVE API
// -------------------------------------------------------------
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export async function listDriveFiles(token: string): Promise<DriveFile[]> {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&orderBy=modifiedTime desc',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadJsonToDrive(
  token: string,
  fileName: string,
  jsonData: any
): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    mimeType: 'application/json'
  };

  const fileContent = JSON.stringify(jsonData, null, 2);
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload to Google Drive (${res.status})`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// GOOGLE SHEETS API
// -------------------------------------------------------------
export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export async function createSpreadsheet(
  token: string,
  title: string
): Promise<SheetCreationResult> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Sheet (${res.status})`);
  }
  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl
  };
}

export async function appendSheetValues(
  token: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update Google Sheet (${res.status})`);
  }
  return await res.json();
}

export async function exportInventoryToGoogleSheets(
  token: string,
  products: Product[],
  inventory: InventoryLevel[],
  locations: Location[]
): Promise<SheetCreationResult> {
  const today = new Date().toISOString().slice(0, 10);
  const sheet = await createSpreadsheet(token, `OmniStock ERP - Live Inventory Master (${today})`);

  // Build rows
  const headers = [
    'SKU',
    'Barcode',
    'Product Name',
    'Category',
    'Packaging Unit',
    'Cost Price ($)',
    'Retail Price ($)',
    'Wholesale Base ($)',
    'MOQ',
    'Reorder Alert Level',
    'Total Stock Units',
    'Cost Valuation ($)',
    'Retail Potential ($)'
  ];

  const rows = products.map((p) => {
    const stock = inventory
      .filter((inv) => inv.productId === p.id)
      .reduce((sum, i) => sum + i.quantityOnHand, 0);

    return [
      p.sku,
      p.barcode,
      p.name,
      p.category,
      p.unit,
      p.costPrice,
      p.retailPrice,
      p.wholesaleBasePrice,
      p.minWholesaleQty,
      p.reorderThreshold,
      stock,
      Number((stock * p.costPrice).toFixed(2)),
      Number((stock * p.retailPrice).toFixed(2))
    ];
  });

  await appendSheetValues(token, sheet.spreadsheetId, 'Sheet1!A1', [headers, ...rows]);
  return sheet;
}

export async function exportSalesToGoogleSheets(
  token: string,
  orders: Order[]
): Promise<SheetCreationResult> {
  const today = new Date().toISOString().slice(0, 10);
  const sheet = await createSpreadsheet(token, `OmniStock ERP - Sales Transactions Ledger (${today})`);

  const headers = [
    'Order Number',
    'Timestamp',
    'Channel',
    'Facility Location',
    'Customer Name',
    'Company / Account',
    'Payment Method',
    'Payment Status',
    'Subtotal ($)',
    'Volume Savings ($)',
    'Tax ($)',
    'Grand Total ($)',
    'COGS ($)',
    'Gross Profit ($)',
    'Cashier'
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt,
    o.channel.toUpperCase(),
    o.locationName,
    o.customerName,
    o.customerCompany || 'N/A',
    o.paymentMethod.replace(/_/g, ' ').toUpperCase(),
    o.paymentStatus.toUpperCase(),
    o.subtotal,
    o.discountTotal,
    o.taxTotal,
    o.grandTotal,
    o.costTotal,
    Number((o.subtotal - o.costTotal).toFixed(2)),
    o.cashier
  ]);

  await appendSheetValues(token, sheet.spreadsheetId, 'Sheet1!A1', [headers, ...rows]);
  return sheet;
}

// -------------------------------------------------------------
// GMAIL API
// -------------------------------------------------------------
export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  from?: string;
  subject?: string;
  date?: string;
}

export async function listRecentGmailMessages(token: string): Promise<GmailMessageItem[]> {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=invoice OR order OR OmniStock OR receipt OR delivery',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API error (${res.status})`);
  }

  const data = await res.json();
  const messages: GmailMessageItem[] = [];

  if (data.messages && Array.isArray(data.messages)) {
    for (const m of data.messages.slice(0, 6)) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          messages.push({
            id: m.id,
            threadId: m.threadId,
            snippet: detail.snippet,
            from,
            subject,
            date
          });
        }
      } catch (e) {
        // Continue
      }
    }
  }

  return messages;
}

export async function sendEmailViaGmail(
  token: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ id: string; threadId: string }> {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = encodeBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email through Gmail (${res.status})`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// GOOGLE CALENDAR API
// -------------------------------------------------------------
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function listCalendarEvents(token: string): Promise<CalendarEvent[]> {
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=25&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Calendar API error (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  token: string,
  summary: string,
  description: string,
  startTimeIso: string,
  endTimeIso: string,
  location?: string
): Promise<CalendarEvent> {
  const eventPayload = {
    summary,
    description,
    location: location || 'OmniStock Central Logistics Dock 14',
    start: { dateTime: startTimeIso },
    end: { dateTime: endTimeIso }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Calendar Event (${res.status})`);
  }

  return await res.json();
}

export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete Calendar Event (${res.status})`);
  }
}
