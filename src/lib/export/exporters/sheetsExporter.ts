import { google } from "googleapis";
import { eventsToExportRows, exportRowsToSheetValues } from "@/lib/export/eventRows";
import type { ExportContext, ExportResult, Exporter } from "@/lib/export/types";
import { getGoogleAuthClient } from "@/lib/googleAuth";

const SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

async function exportToGoogleSheets(ctx: ExportContext): Promise<ExportResult> {
  const auth = getGoogleAuthClient(SHEETS_SCOPES);
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  const rows = eventsToExportRows(ctx.events);
  const values = exportRowsToSheetValues(rows);

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: ctx.fileName },
      sheets: [{ properties: { title: "予定" } }],
    },
  });

  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("スプレッドシートの作成に失敗しました。");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "予定!A1",
    valueInputOption: "RAW",
    requestBody: { values },
  });

  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    fileName: ctx.fileName,
  };
}

export const sheetsExporter: Exporter = {
  format: "sheets",
  export: exportToGoogleSheets,
};
