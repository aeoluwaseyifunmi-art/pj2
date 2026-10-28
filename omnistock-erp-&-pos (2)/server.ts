import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client
// In AI Studio, process.env.GEMINI_API_KEY is securely injected on the server
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Health check & status
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '4.02',
    hasApiKey: Boolean(apiKey),
    engine: ai ? 'gemini-3.8-flash' : 'rule_based_fallback',
    timestamp: new Date().toISOString(),
  });
});

/**
 * AI Executive Business Insights & Profit/Sales Intelligence
 */
app.post('/api/ai/insights', async (req: Request, res: Response) => {
  try {
    const { snapshot, userPrompt, focusArea } = req.body;

    if (!snapshot) {
      return res.status(400).json({ error: 'Missing business snapshot data' });
    }

    const {
      totalRevenue = 0,
      totalCost = 0,
      grossProfit = 0,
      marginPercent = 0,
      orderCount = 0,
      inventoryValuation = 0,
      outOfStockCount = 0,
      lowStockCount = 0,
      topSellingProducts = [],
      slowMovingProducts = [],
      customerBalances = [],
      recentRefunds = [],
      activeLocation = 'All Locations',
    } = snapshot;

    // Structured prompt grounded on real database numbers
    const contextPrompt = `
You are the Chief Financial & Inventory AI Intelligence Officer for OmniStock ERP & POS.
Analyze the following REAL business metrics from the system database for "${activeLocation}":

[FINANCIAL HEALTH SNAPSHOT]
- Total Sales Revenue: $${Number(totalRevenue).toFixed(2)}
- Cost of Goods Sold (COGS): $${Number(totalCost).toFixed(2)}
- Gross Profit: $${Number(grossProfit).toFixed(2)}
- Gross Margin: ${Number(marginPercent).toFixed(1)}%
- Total Completed Transactions: ${orderCount}
- Average Order Value (AOV): $${orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : '0.00'}
- Total Inventory Valuation (At Cost): $${Number(inventoryValuation).toFixed(2)}

[INVENTORY RISKS & RESTOCK ALERTS]
- Out of Stock SKUs (0 qty): ${outOfStockCount}
- Low Stock SKUs (Below Threshold): ${lowStockCount}
- Top Selling Products: ${JSON.stringify(topSellingProducts.slice(0, 5))}
- Slow Moving / Dead Stock (30+ days no sale): ${JSON.stringify(slowMovingProducts.slice(0, 5))}

[ACCOUNTS RECEIVABLE & RETURNS]
- Total Outstanding Customer Balances: $${customerBalances.reduce((s: number, c: any) => s + (c.outstandingBalance || 0), 0).toFixed(2)}
- Customers with High Credit Exposure: ${JSON.stringify(customerBalances.filter((c: any) => (c.outstandingBalance || 0) > 1000).slice(0, 4))}
- Recent Refunds / Returns: ${recentRefunds.length} total ($${recentRefunds.reduce((s: number, r: any) => s + (r.refundAmount || 0), 0).toFixed(2)})

[USER INQUIRY / FOCUS AREA]
Focus: ${focusArea || 'Comprehensive Executive Assessment'}
Specific Query: "${userPrompt || 'Provide an executive summary of current profitability, restock urgency, dead capital risks, and three strategic recommendations.'}"

Instructions:
1. Ground every claim on the real numbers provided above. Never invent fake data or prices.
2. Structure your response with clean Markdown:
   - ### Executive Summary
   - ### Profit & Revenue Highlights
   - ### Inventory & Restock Urgency (Identify specific SKUs needing PO replenishment)
   - ### Cash Flow & Customer Credit Health
   - ### Strategic Action Plan (3 concrete, high-ROI steps)
3. Keep the tone concise, authoritative, and direct for a business owner or operations manager.
`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          temperature: 0.2, // Low temperature for high factual accuracy
        },
      });

      return res.json({
        success: true,
        source: 'gemini-3.8-flash',
        analysis: response.text,
        timestamp: new Date().toISOString(),
      });
    }

    // High-fidelity algorithmic fallback when API key is pending
    const fallbackSummary = `### Executive Summary
OmniStock ERP processed **${orderCount} orders** generating **$${Number(totalRevenue).toFixed(2)}** in gross revenue with a **${Number(marginPercent).toFixed(1)}% gross margin** ($${Number(grossProfit).toFixed(2)} profit).

### Profit & Revenue Highlights
- Operating healthy margin across retail & wholesale channels.
- Average transaction size stands at **$${orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : '0.00'}**.

### Inventory & Restock Urgency
- **${outOfStockCount} SKUs are currently out of stock** and **${lowStockCount} SKUs have breached reorder thresholds**.
- Top selling SKU demand: ${topSellingProducts[0]?.name || 'High demand items'} require automated purchase order issuance.

### Cash Flow & Customer Credit Health
- Accounts receivable exposure: **$${customerBalances.reduce((s: number, c: any) => s + (c.outstandingBalance || 0), 0).toFixed(2)}** in unsettled B2B net terms.

### Strategic Action Plan
1. **Issue Restock POs**: Replenish low-stock fast movers to prevent stockout revenue loss.
2. **Reclaim Dead Capital**: Run promotions on slow-moving inventory to liberate cash flow.
3. **Collect Aging Invoices**: Enforce 30-day payment terms on high balance wholesale accounts.`;

    return res.json({
      success: true,
      source: 'local_analytical_engine',
      analysis: fallbackSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI Insights endpoint error:', error);
    res.status(500).json({
      error: 'Failed to generate AI insights',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * AI Stockout Forecast & Purchase Order Predictor
 */
app.post('/api/ai/forecast-restock', async (req: Request, res: Response) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No inventory items provided' });
    }

    const itemsSummary = items.map((it: any) => ({
      sku: it.sku,
      name: it.name,
      currentStock: it.currentStock,
      reorderThreshold: it.reorderThreshold,
      dailySalesVelocity: it.dailySalesVelocity || 1,
      unitCost: it.unitCost,
      supplier: it.supplier || 'Standard Supplier',
    }));

    const prompt = `
You are a supply chain optimization model. Based on this real inventory catalog:
${JSON.stringify(itemsSummary, null, 2)}

For each item, compute:
1. daysUntilStockout: currentStock / (dailySalesVelocity || 1)
2. recommendedReorderQty: max(reorderThreshold * 2.5 - currentStock, 20)
3. urgency: 'critical' (if stock <= 0 or days <= 3), 'warning' (days <= 7), 'healthy' (days > 7)
4. reason: 1-sentence concise reason.

Return a valid JSON array matching:
[
  {
    "sku": string,
    "recommendedReorderQty": number,
    "daysUntilStockout": number,
    "urgency": "critical" | "warning" | "healthy",
    "reason": string,
    "estimatedCost": number
  }
]
`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '[]');
      return res.json({ success: true, forecast: parsed, source: 'gemini-3.8-flash' });
    }

    // Algorithmic computation fallback
    const computed = itemsSummary.map((item: any) => {
      const days = item.currentStock <= 0 ? 0 : Math.round(item.currentStock / Math.max(1, item.dailySalesVelocity));
      const urgency = item.currentStock <= 0 || days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'healthy';
      const reorderQty = Math.max(20, Math.ceil((item.reorderThreshold * 2.5) - item.currentStock));
      return {
        sku: item.sku,
        recommendedReorderQty: reorderQty,
        daysUntilStockout: days,
        urgency,
        reason: urgency === 'critical' ? 'Stock is at or near zero; immediate supplier replenishment required.' : `Inventory run rate estimates ${days} days of remaining supply.`,
        estimatedCost: Number((reorderQty * (item.unitCost || 10)).toFixed(2))
      };
    });

    return res.json({ success: true, forecast: computed, source: 'local_analytical_engine' });
  } catch (error: any) {
    console.error('Restock forecast error:', error);
    res.status(500).json({ error: error.message || 'Restock calculation error' });
  }
});

// Setup dev server with Vite middlewares OR serve production build
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniStock Enterprise Server running on http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer();
