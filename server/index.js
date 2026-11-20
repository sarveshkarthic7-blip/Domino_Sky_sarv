import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend assets from production build if available
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Load dataset
const datasetPath = path.resolve(__dirname, '../src/data/flight_network.json');
let dataset = null;
try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (err) {
  console.error('Failed to load flight_network.json:', err);
}

// Check for Gemini API key
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!getGeminiApiKey(),
    service: 'DOMINO SKY Operations Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Network dataset endpoint
app.get('/api/network', (req, res) => {
  if (!dataset) {
    return res.status(500).json({ error: 'Dataset not loaded' });
  }
  res.json(dataset);
});

/**
 * Deterministic Operations Fallback Generator
 * Generates an executive airline operations report when Gemini API key is absent or offline.
 */
function generateDeterministicExplanation(summary) {
  const { kpis, params, topDelayedFlights = [], brokenConnections = [], crewAlerts = [], comparison = null } = summary;

  let report = `### DOMINO SKY OPERATIONS CONTROL CENTRE (OCC) BRIEFING\n\n`;

  if (params.closedAirport) {
    report += `**Incident Alert:** Scheduled closure of **${params.closedAirport}** from **${params.closureStart}** for **${params.closureDuration} minutes**.\n\n`;
  } else {
    report += `**Incident Alert:** Baseline flight operations across normal flight schedule.\n\n`;
  }

  report += `#### 1. Disruption Impact Assessment\n`;
  report += `* **Delayed Flights:** ${kpis.delayed_flights} of ${kpis.total_flights} flights (${Math.round((kpis.delayed_flights / kpis.total_flights) * 100)}% of network).\n`;
  report += `* **Cumulative Departure Delay:** ${kpis.total_departure_delay_min} minutes (Average ${kpis.average_delay_min} min per delayed flight).\n`;
  report += `* **Cancelled Flights:** ${kpis.cancelled_flights} flights.\n`;
  report += `* **Broken Passenger Connections:** ${kpis.broken_connections} connection pairs, impacting **${kpis.affected_passengers} ticketed passengers**.\n`;
  report += `* **Crew Duty Status:** ${kpis.crew_duty_violations} crew violations, ${kpis.crew_duty_warnings} high-risk warnings (approaching 600-minute maximum duty limit).\n\n`;

  if (topDelayedFlights.length > 0) {
    report += `#### 2. Primary Cascade Propagation Chains\n`;
    report += `Delays propagated through aircraft rotations requiring the mandatory 30-minute minimum turnaround:\n`;
    topDelayedFlights.slice(0, 4).forEach((f) => {
      report += `* **Flight ${f.flight_id} (${f.tail_id}):** ${f.origin} → ${f.destination} delayed by **${f.dep_delay} min** (Dep: ${f.actual_dep}, Arr: ${f.actual_arr}). Reason: ${f.delay_reasons[0] || 'Turnaround propagation'}.\n`;
    });
    report += `\n`;
  }

  if (brokenConnections.length > 0) {
    report += `#### 3. Passenger Transfer Failures\n`;
    brokenConnections.slice(0, 3).forEach((c) => {
      report += `* **Connection ${c.connection_id} at ${c.airport}:** Flight ${c.from_flight} → ${c.to_flight} broke with a transfer shortfall of **${c.shortfall_min} min** (${c.passengers} passengers stranded).\n`;
    });
    report += `\n`;
  }

  if (crewAlerts.length > 0) {
    report += `#### 4. Flight Crew Duty Exceedances\n`;
    crewAlerts.forEach((cr) => {
      report += `* **Crew ${cr.crew_id} (${cr.base} base, assigned to ${cr.tail_id}):** Actual duty reached **${cr.actual_duty_mins} min** against the ${cr.max_duty_mins} min legal limit (${cr.duty_utilization_pct}% duty capacity).\n`;
    });
    report += `\n`;
  }

  if (comparison && comparison.delta) {
    report += `#### 5. Recovery Strategy Evaluation\n`;
    if (comparison.delta.is_improved) {
      report += `* **Result:** Recovery actions demonstrated **positive network stabilization**.\n`;
      report += `* **Delay Reduction:** Saved **${Math.abs(comparison.delta.total_delay_diff_min)} minutes** of total network delay.\n`;
      if (comparison.delta.broken_connections_diff < 0) {
        report += `* **Connections Restored:** Protected **${Math.abs(comparison.delta.broken_connections_diff)} passenger connections** (${Math.abs(comparison.delta.affected_passengers_diff)} passengers).\n`;
      }
      if (comparison.delta.crew_violations_diff < 0) {
        report += `* **Crew Violations Averted:** Resolved **${Math.abs(comparison.delta.crew_violations_diff)} crew duty violations**.\n`;
      }
    } else {
      report += `* **Result:** Applied recovery strategy did not achieve net positive delay reduction. Review alternate spare aircraft positioning or selective cancellation.\n`;
    }
    report += `\n`;
  }

  report += `#### 6. OCC Recommended Action Plan\n`;
  report += `1. **Spare Aircraft Deployment:** Activate spare aircraft VT-DS18 at DEL and VT-DS17 at BLR for downstream legs whose inbound aircraft have exceeded 30-minute buffers.\n`;
  report += `2. **Passenger Re-accommodation:** Immediately rebook the ${kpis.affected_passengers} passengers from broken transfers onto alternative direct legs.\n`;
  report += `3. **Crew Reserve Callout:** Place standby reserve crews on alert at base hubs to relieve rotations exceeding 540 duty minutes.\n`;

  return report;
}

// AI explanation endpoint
app.post('/api/ai/explain', async (req, res) => {
  const summary = req.body;

  if (!summary || !summary.kpis) {
    return res.status(400).json({ error: 'Missing simulation summary in request body' });
  }

  const apiKey = getGeminiApiKey();

  // If no API key is provided, return deterministic fallback directly
  if (!apiKey) {
    const explanation = generateDeterministicExplanation(summary);
    return res.json({
      source: 'deterministic_fallback',
      explanation,
      hasGeminiKey: false,
    });
  }

  // If API key is present, invoke Google Gemini 2.5 Flash
  try {
    const prompt = `You are an expert Airline Operations Controller Assistant for DOMINO SKY Flight Operations Control Centre (OCC).
You are analyzing a deterministic simulation of an airline disruption cascade and recovery.

Here is the structured calculation report produced by our deterministic simulation engine:
${JSON.stringify(summary, null, 2)}

Strict Instructions:
1. Explain why flights were delayed and how disruption propagated through aircraft rotations and turnaround buffers.
2. Explain broken passenger connections and affected passenger counts.
3. Highlight crew duty warnings or violations.
4. If recovery actions (aircraft swap or flight cancellation) were tested, compare the before-and-after results and state whether the recovery improved operations.
5. Provide actionable airline dispatcher recommendations in simple, clear, professional language.
CRITICAL MANDATE: All numerical values (flights, delay minutes, passenger counts, connection counts, crew duty minutes) have already been strictly calculated by the deterministic simulation engine. You MUST reference and explain these exact numbers. NEVER calculate, alter, estimate, or invent numbers.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API call failed, falling back to deterministic explanation:', response.status, errText);
      const explanation = generateDeterministicExplanation(summary);
      return res.json({
        source: 'deterministic_fallback',
        explanation,
        hasGeminiKey: true,
        apiError: `Gemini API returned status ${response.status}`,
      });
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!candidateText) {
      const explanation = generateDeterministicExplanation(summary);
      return res.json({
        source: 'deterministic_fallback',
        explanation,
        hasGeminiKey: true,
      });
    }

    res.json({
      source: 'gemini',
      explanation: candidateText,
      hasGeminiKey: true,
      model: 'gemini-2.5-flash',
    });
  } catch (error) {
    console.error('Gemini API fetch error:', error);
    const explanation = generateDeterministicExplanation(summary);
    res.json({
      source: 'deterministic_fallback',
      explanation,
      hasGeminiKey: true,
      apiError: error.message,
    });
  }
});

// Single-page application fallback route
app.get('*', (req, res) => {
  const indexHtml = path.resolve(__dirname, '../dist/index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Application build not found. Run npm run build first.');
  }
});

app.listen(PORT, () => {
  console.log(`DOMINO SKY Operations Backend listening on port ${PORT}`);
  console.log(`Gemini API Key configured: ${!!getGeminiApiKey()}`);
});
