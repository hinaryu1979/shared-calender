import { randomUUID } from "node:crypto";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticateCalendar } from "@/lib/calendarAuth";
import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { formPayloadToFcStrings } from "@/lib/eventFormConverters";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { maskEventForView } from "@/lib/maskEventForView";
import type { EventFormPayload } from "@/lib/eventValidation";
import { validateEventPayload } from "@/lib/eventValidation";

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

export async function GET(req: Request, ctx: { params: Promise<{ calendarId: string }> }) {
  const { calendarId } = await ctx.params;
  try {
    const auth = await authenticateCalendar(calendarId, req);
    if (!auth.ok) {
      if (auth.reason === "not_found") return jsonError(404, auth.reason);
      return jsonError(401, auth.reason);
    }
    const db = getAdminFirestore();
    const snap = await db.collection("calendars").doc(calendarId).collection("events").get();
    let events = snap.docs.map((d) => docToRecord(d.id, d.data()));
    if (auth.role === "view") {
      events = events.map(maskEventForView);
    }
    return NextResponse.json({ events });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, "server_error", msg);
  }
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

    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object") return jsonError(400, "invalid_body");

    const v = validateEventPayload(body as EventFormPayload);
    if (!v.ok) return jsonError(400, "validation_error", v.message);

    const payload = body as EventFormPayload;
    const { start, end, allDay } = formPayloadToFcStrings(payload);
    const id = randomUUID();
    const record: CalendarEventRecord = {
      id,
      title: payload.title.trim(),
      start,
      end,
      allDay,
      visibility: payload.visibility,
      memo: payload.memo.trim(),
    };

    const db = getAdminFirestore();
    await db
      .collection("calendars")
      .doc(calendarId)
      .collection("events")
      .doc(id)
      .set({
        title: record.title,
        start: record.start,
        end: record.end,
        allDay: record.allDay,
        visibility: record.visibility,
        memo: record.memo,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ event: record });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, "server_error", msg);
  }
}
