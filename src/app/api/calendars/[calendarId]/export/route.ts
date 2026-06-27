import { type DocumentData } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { authenticateCalendar } from "@/lib/calendarAuth";
import { filterEventsByRange, isExportFormat, resolveExportFileName, runExport } from "@/lib/export";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { ExportRequest } from "@/lib/export/types";

export const runtime = "nodejs";

function docToRecord(id: string, data: DocumentData): CalendarEventRecord {
  return {
    id,
    title: String(data.title ?? ""),
    start: String(data.start ?? ""),
    end: String(data.end ?? ""),
    allDay: Boolean(data.allDay),
    visibility: data.visibility === "private" ? "private" : "public",
    memo: typeof data.memo === "string" ? data.memo : "",
  };
}

function jsonError(status: number, error: string, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req: Request, ctx: { params: Promise<{ calendarId: string }> }) {
  const { calendarId } = await ctx.params;
  try {
    const auth = await authenticateCalendar(calendarId, req);
    if (!auth.ok) {
      if (auth.reason === "not_found") return jsonError(404, auth.reason);
      return jsonError(401, auth.reason);
    }
    if (auth.role !== "edit") return jsonError(403, "forbidden");

    const body = (await req.json()) as Partial<ExportRequest>;
    if (!body.format || !isExportFormat(body.format)) {
      return jsonError(400, "validation_error", "format が不正です。");
    }
    if (!isValidDateString(body.startDate) || !isValidDateString(body.endDate)) {
      return jsonError(400, "validation_error", "開始日・終了日は YYYY-MM-DD 形式で指定してください。");
    }
    if (body.startDate > body.endDate) {
      return jsonError(400, "validation_error", "開始日は終了日以前にしてください。");
    }

    const db = getAdminFirestore();
    const snap = await db.collection("calendars").doc(calendarId).collection("events").get();
    const allEvents = snap.docs.map((d) => docToRecord(d.id, d.data()));
    const filtered = filterEventsByRange(allEvents, body.startDate, body.endDate);
    const fileName = resolveExportFileName(body.startDate, body.endDate, body.fileName);

    const result = await runExport(
      {
        format: body.format,
        startDate: body.startDate,
        endDate: body.endDate,
        fileName,
      },
      filtered,
    );

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, "server_error", msg);
  }
}
