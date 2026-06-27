import { sheetsExporter } from "@/lib/export/exporters/sheetsExporter";
import type { ExportContext, ExportFormat, ExportRequest, ExportResult } from "@/lib/export/types";

const exporters = {
  sheets: sheetsExporter,
} as const satisfies Record<ExportFormat, { format: ExportFormat; export: (ctx: ExportContext) => Promise<ExportResult> }>;

export function isExportFormat(value: string): value is ExportFormat {
  return value in exporters;
}

export async function runExport(request: ExportRequest, events: ExportContext["events"]): Promise<ExportResult> {
  const exporter = exporters[request.format];
  return exporter.export({ events, fileName: request.fileName ?? "" });
}

export { filterEventsByRange } from "@/lib/export/filterEventsByRange";
export { resolveExportFileName } from "@/lib/export/filename";
