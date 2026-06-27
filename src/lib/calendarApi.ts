import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import type { EventFormPayload } from "@/lib/eventValidation";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || res.statusText);
  }
}

export async function fetchCalendarEvents(calendarId: string, token: string): Promise<CalendarEventRecord[]> {
  const res = await fetch(`/api/calendars/${encodeURIComponent(calendarId)}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await parseJson<{ events?: CalendarEventRecord[]; error?: string; message?: string }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
  return data.events ?? [];
}

export async function createCalendarEvent(
  calendarId: string,
  token: string,
  payload: EventFormPayload,
): Promise<CalendarEventRecord> {
  const res = await fetch(`/api/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ event?: CalendarEventRecord; error?: string; message?: string }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
  if (!data.event) throw new Error("invalid_response");
  return data.event;
}

export async function updateCalendarEvent(
  calendarId: string,
  token: string,
  record: CalendarEventRecord,
): Promise<void> {
  const res = await fetch(
    `/api/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(record.id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    },
  );
  const data = await parseJson<{ error?: string; message?: string }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
}

export async function deleteCalendarEvent(calendarId: string, token: string, eventId: string): Promise<void> {
  const res = await fetch(
    `/api/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = await parseJson<{ error?: string; message?: string }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
}

export type ExportSheetsParams = {
  startDate: string;
  endDate: string;
  fileName?: string;
};

export type ExportSheetsResult = {
  url: string;
  fileName: string;
};

export async function exportCalendarToSheets(
  calendarId: string,
  token: string,
  params: ExportSheetsParams,
): Promise<ExportSheetsResult> {
  const res = await fetch(`/api/calendars/${encodeURIComponent(calendarId)}/export`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "sheets",
      startDate: params.startDate,
      endDate: params.endDate,
      fileName: params.fileName,
    }),
  });
  const data = await parseJson<ExportSheetsResult & { error?: string; message?: string }>(res);
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
  if (!data.url) throw new Error("invalid_response");
  return { url: data.url, fileName: data.fileName };
}
