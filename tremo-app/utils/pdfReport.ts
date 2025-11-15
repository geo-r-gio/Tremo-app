import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ----------------------
// Type Definitions
// ----------------------

export type TremorPoint = {
  value: number;
  timestamp?: string;
};

export type FrequencyPoint = {
  value: number;
};

export type TremorSession = {
  date: string;
  mode: string;
  duration: string;
  before: number;
  after: number;
  reduction: string;
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
  // Safe average tremor calculation
  const avgTremor =
    tremorData.length > 0
      ? tremorData.reduce((a: number, b: TremorPoint) => a + b.value, 0) /
        tremorData.length
      : 0;

  const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Tremor Report</h1>

        <h2>Weekly Summary</h2>
        <p><strong>Average Tremor:</strong> ${avgTremor.toFixed(2)} g</p>

        <h2>Tremor Sessions</h2>
        ${sessions
          .map(
            (s: TremorSession) => `
              <div style="margin-bottom: 12px;">
                <strong>Date:</strong> ${s.date}<br/>
                <strong>Mode:</strong> ${s.mode}<br/>
                <strong>Duration:</strong> ${s.duration}<br/>
                <strong>Before:</strong> ${s.before} g<br/>
                <strong>After:</strong> ${s.after} g<br/>
                <strong>Reduction:</strong> ${s.reduction}
              </div>
            `
          )
          .join("")}

        <h2>Tremor Intensity Data</h2>
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