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

  const totalReduction =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.reduction, 0)
      : 0;

  const html = `
    <html>
      <body style="font-family: Arial; padding: 24px; background: #f7fafe;">

        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e4fa3; margin: 0;">Patient Tremor Assessment Report</h1>
          <p style="color: #555; font-size: 14px; margin-top: 6px;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
        </div>

        <!-- SUMMARY SECTION -->
        <div style="display: flex; gap: 16px; margin-bottom: 28px;">
          <div style="flex: 1; background: #e9f2ff; padding: 14px; border-radius: 10px;">
            <h3 style="margin: 0; color: #1e4fa3;">Average Tremor</h3>
            <p style="font-size: 22px; margin: 4px 0;"><strong>${avgTremor.toFixed(
              2
            )} Hz</strong></p>
          </div>

          <div style="flex: 1; background: #e9f2ff; padding: 14px; border-radius: 10px;">
            <h3 style="margin: 0; color: #1e4fa3;">Avg Session Frequency</h3>
            <p style="font-size: 22px; margin: 4px 0;"><strong>${avgFreqAcrossSessions.toFixed(
              2
            )} Hz</strong></p>
          </div>

          <div style="flex: 1; background: #e9f2ff; padding: 14px; border-radius: 10px;">
            <h3 style="margin: 0; color: #1e4fa3;">Total Reduction</h3>
            <p style="font-size: 22px; margin: 4px 0;"><strong>${totalReduction.toFixed(
              2
            )} %</strong></p>
          </div>
        </div>

        <!-- SESSIONS SECTION -->
        <h2 style="color: #1e4fa3; border-bottom: 2px solid #c7d7f5; padding-bottom: 4px;">
          Session Summary
        </h2>

        ${sessions
          .map(
            (s) => `
              <div style="
                background: white;
                padding: 14px;
                margin-top: 14px;
                border-radius: 10px;
                border: 1px solid #d8e2f3;
              ">
                <p><strong>Date:</strong> ${s.date}</p>
                <p><strong>Mode:</strong> ${s.mode}</p>
                <p><strong>Duration:</strong> ${s.duration} sec</p>
                <p><strong>Baseline (Before):</strong> ${s.before} Hz</p>
                <p><strong>Post-Therapy (After):</strong> ${s.after} Hz</p>
                <p><strong>Reduction:</strong> ${s.reduction.toFixed(2)} %</p>
                <p><strong>Average Frequency:</strong> ${s.avgFrequency.toFixed(
                  2
                )} Hz</p>
              </div>
            `
          )
          .join("")}

        <!-- TREND SECTION -->
        <h2 style="color: #1e4fa3; border-bottom: 2px solid #c7d7f5; padding-bottom: 4px; margin-top: 30px;">
          Daily Tremor Trend (Averages)
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background: #e7efff;">
            <th style="padding: 8px; text-align: left;">Day</th>
            <th style="padding: 8px; text-align: left;">Value (Hz)</th>
          </tr>
          ${tremorData
            .map(
              (p) => `
                <tr>
                  <td style="padding: 8px;">${p.label}</td>
                  <td style="padding: 8px;">${p.value.toFixed(2)}</td>
                </tr>
              `
            )
            .join("")}
        </table>

        <!-- FOOTER -->
        <p style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
          This report summarizes tremor activity measured using your wearable device.
          It is intended for clinical reference and progression tracking.
        </p>
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