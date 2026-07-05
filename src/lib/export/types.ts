import type { CalendarEventRecord } from "@/lib/calendarEventTypes";

export type ExportFormat = "sheets" | "csv";

export type ExportRow = {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  memo: string;
};

export type ExportRequest = {
  format: ExportFormat;
  startDate: string;
  endDate: string;
  fileName?: string;
};

export type ExportResult = {
  url: string;
  fileName: string;
};

export type ExportContext = {
  events: CalendarEventRecord[];
  fileName: string;
};

export type Exporter = {
  format: ExportFormat;
  export: (ctx: ExportContext) => Promise<ExportResult>;
};
