import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ----------------------
// Type Definitions
// ----------------------

export type TremorPoint = {
  value: number;
  label: string;
};

export type FrequencyPoint = {
  value: number;
  timestamp?: string;
};

export type TremorSession = {
  id: string;
  date: string;
  mode: string;
  duration: string; // string for PDF
  before: number;
  after: number;
  reduction: number; // keep as number
  avgFrequency: number;
};

// Props expected by generatePDFReport()
export interface PDFReportProps {
  tremorData: TremorPoint[];
  frequencyData: FrequencyPoint[];
  sessions: TremorSession[];
}

// ----------------------
// Main function
// ----------------------

export async function generatePDFReport({
  tremorData,
  frequencyData,
  sessions,
}: PDFReportProps): Promise<void> {
  // Safe averages
  const avgTremor =
    tremorData.length > 0
      ? tremorData.reduce((sum, p) => sum + p.value, 0) / tremorData.length
      : 0;

  const avgFreqAcrossSessions =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.avgFrequency, 0) / sessions.length
      : 0;

  const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Tremor Report</h1>

        <h2>Weekly / Monthly Summary</h2>
        <p><strong>Average Tremor (chart):</strong> ${avgTremor.toFixed(2)} Hz</p>
        <p><strong>Average Frequency (sessions):</strong> ${avgFreqAcrossSessions.toFixed(2)} Hz</p>
        <p><strong>Total Sessions:</strong> ${sessions.length}</p>

        <h2>Tremor Sessions Details</h2>
        ${sessions
          .map(
            (s) => `
            <div style="margin-bottom: 12px; padding: 8px; border: 1px solid #ccc; border-radius: 8px;">
              <strong>ID:</strong> ${s.id}<br/>
              <strong>Date:</strong> ${s.date}<br/>
              <strong>Mode:</strong> ${s.mode}<br/>
              <strong>Duration:</strong> ${s.duration}<br/>
              <strong>Before:</strong> ${s.before} g<br/>
              <strong>After:</strong> ${s.after} g<br/>
              <strong>Reduction:</strong> ${s.reduction.toFixed(2)} g<br/>
              <strong>Avg. Frequency:</strong> ${s.avgFrequency.toFixed(2)} Hz
            </div>
          `
          )
          .join("")}

        <h2>Tremor Chart Data</h2>
        <pre>${JSON.stringify(tremorData, null, 2)}</pre>

        <h2>Frequency Data</h2>
        <pre>${JSON.stringify(frequencyData, null, 2)}</pre>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    alert("Sharing not available on this device");
    return;
  }

  await Sharing.shareAsync(uri);
}