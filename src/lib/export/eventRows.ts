import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { addLocalDays, parseDateLocal } from "@/lib/dateTimeLocal";
import type { ExportRow } from "@/lib/export/types";

const EXPORT_HEADERS = ["日付", "開始時刻", "終了時刻", "予定タイトル", "メモ"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTimeFromIso(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateFromIso(iso: string): string {
  return iso.slice(0, 10);
}

function eventToRow(ev: CalendarEventRecord): ExportRow {
  if (ev.allDay) {
    const startDate = formatDateFromIso(ev.start);
    const endExclusive = parseDateLocal(ev.end.slice(0, 10));
    const endInclusive = addLocalDays(endExclusive, -1);
    const endDate = `${endInclusive.getFullYear()}-${pad2(endInclusive.getMonth() + 1)}-${pad2(endInclusive.getDate())}`;
    const date = startDate === endDate ? startDate : `${startDate} ～ ${endDate}`;
    return {
      date,
      startTime: "",
      endTime: "",
      title: ev.title,
      memo: ev.memo,
    };
  }
  return {
    date: formatDateFromIso(ev.start),
    startTime: formatTimeFromIso(ev.start),
    endTime: formatTimeFromIso(ev.end),
    title: ev.title,
    memo: ev.memo,
  };
}

export function eventsToExportRows(events: CalendarEventRecord[]): ExportRow[] {
  const sorted = [...events].sort((a, b) => {
    const aStart = a.allDay ? parseDateLocal(a.start.slice(0, 10)).getTime() : new Date(a.start).getTime();
    const bStart = b.allDay ? parseDateLocal(b.start.slice(0, 10)).getTime() : new Date(b.start).getTime();
    if (aStart !== bStart) return aStart - bStart;
    const aEnd = a.allDay ? parseDateLocal(a.end.slice(0, 10)).getTime() : new Date(a.end).getTime();
    const bEnd = b.allDay ? parseDateLocal(b.end.slice(0, 10)).getTime() : new Date(b.end).getTime();
    return aEnd - bEnd;
  });
  return sorted.map(eventToRow);
}

export function exportRowsToSheetValues(rows: ExportRow[]): string[][] {
  const header = [...EXPORT_HEADERS];
  const body = rows.map((r) => [r.date, r.startTime, r.endTime, r.title, r.memo]);
  return [header, ...body];
}
