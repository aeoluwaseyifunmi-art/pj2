/**
 * OmniStock ERP Export Utilities
 * Provides CSV, Excel (Spreadsheet XML/CSV format), and Printable PDF reporting
 */

export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  downloadFile(`${filename}.csv`, 'text/csv;charset=utf-8;', csvContent);
}

export function exportToExcel(filename: string, sheetName: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  
  // Excel XML spreadsheet structure (supported universally by Microsoft Excel, Numbers, and Google Sheets)
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName || 'Sheet1'}">
  <Table>
   <Row>`;

  headers.forEach((h) => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
  });
  xml += `</Row>`;

  rows.forEach((row) => {
    xml += `<Row>`;
    headers.forEach((h) => {
      const val = row[h];
      const isNum = typeof val === 'number';
      const safeVal = isNum ? val : escapeXml(String(val ?? ''));
      xml += `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${safeVal}</Data></Cell>`;
    });
    xml += `</Row>`;
  });

  xml += `</Table>
 </Worksheet>
</Workbook>`;

  downloadFile(`${filename}.xls`, 'application/vnd.ms-excel', xml);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printAuditStatement(options: {
  title: string;
  subtitle?: string;
  metrics: { label: string; value: string }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerNotes?: string;
}): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const { title, subtitle, metrics, tableHeaders, tableRows, footerNotes } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} | OmniStock ERP Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827;
      margin: 40px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #10b981;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 24px; font-weight: 700; color: #065f46; margin: 0; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .meta { font-family: monospace; font-size: 11px; text-align: right; color: #4b5563; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 12px;
      border-radius: 6px;
    }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .metric-val { font-size: 20px; font-weight: 700; color: #111827; margin-top: 4px; font-family: monospace; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    th {
      background: #f3f4f6;
      border-bottom: 2px solid #d1d5db;
      text-align: left;
      padding: 8px 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) { background: #fafafa; }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${title}</h1>
      <div class="subtitle">${subtitle || 'Official Enterprise Audit & Sales Statement'}</div>
    </div>
    <div class="meta">
      <div>SYSTEM: OMNISTOCK ERP v4.02</div>
      <div>GENERATED: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="metrics-grid">
    ${metrics
      .map(
        (m) => `
      <div class="metric-card">
        <div class="metric-label">${m.label}</div>
        <div class="metric-val">${m.value}</div>
      </div>
    `
      )
      .join('')}
  </div>

  <table>
    <thead>
      <tr>
        ${tableHeaders.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows
        .map(
          (row) => `
        <tr>
          ${row.map((cell) => `<td>${cell}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>${footerNotes || 'OmniStock ERP Ledger • Audit-Verified Record'}</div>
    <div>Page 1 of 1</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
