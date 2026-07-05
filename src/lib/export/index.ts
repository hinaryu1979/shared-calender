import { sheetsExporter } from "@/lib/export/exporters/sheetsExporter";
import type { ExportContext, ExportFormat, ExportRequest, ExportResult } from "@/lib/export/types";

const EXPORT_FORMATS = ["sheets", "csv"] as const satisfies readonly ExportFormat[];

/** Google API を用いるエクスポーター。CSV は route 側で直接処理するため含めない。 */
const exporters = {
  sheets: sheetsExporter,
} as const satisfies Partial<
  Record<ExportFormat, { format: ExportFormat; export: (ctx: ExportContext) => Promise<ExportResult> }>
>;

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export async function runExport(request: ExportRequest, events: ExportContext["events"]): Promise<ExportResult> {
  const exporter = exporters[request.format as keyof typeof exporters];
  if (!exporter) {
    throw new Error(`未対応のエクスポート形式です: ${request.format}`);
  }
  return exporter.export({ events, fileName: request.fileName ?? "" });
}

export { filterEventsByRange } from "@/lib/export/filterEventsByRange";
export { resolveExportFileName } from "@/lib/export/filename";
export { eventsToExportRows, exportRowsToCsv } from "@/lib/export/eventRows";
