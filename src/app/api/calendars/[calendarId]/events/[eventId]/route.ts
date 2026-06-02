import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticateCalendar } from "@/lib/calendarAuth";
import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { recordToFormInitial } from "@/lib/eventFormConverters";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { validateEventPayload } from "@/lib/eventValidation";

export const runtime = "nodejs";

function jsonError(status: number, error: string, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ calendarId: string; eventId: string }> },
) {
  const { calendarId, eventId } = await ctx.params;
  try {
    const auth = await authenticateCalendar(calendarId, req);
    if (!auth.ok) {
      if (auth.reason === "not_found") return jsonError(404, auth.reason);
      return jsonError(401, auth.reason);
    }
    if (auth.role !== "edit") return jsonError(403, "forbidden");

    const body = (await req.json()) as Partial<CalendarEventRecord>;
    if (body.id && body.id !== eventId) return jsonError(400, "id_mismatch");

    const record: CalendarEventRecord = {
      id: eventId,
      title: String(body.title ?? ""),
      start: String(body.start ?? ""),
      end: String(body.end ?? ""),
      allDay: Boolean(body.allDay),
      visibility: body.visibility === "private" ? "private" : "public",
      memo: typeof body.memo === "string" ? body.memo : "",
    };

    const payload = recordToFormInitial(record);
    const v = validateEventPayload(payload);
    if (!v.ok) return jsonError(400, "validation_error", v.message);

    const db = getAdminFirestore();
    const ref = db.collection("calendars").doc(calendarId).collection("events").doc(eventId);
    const snap = await ref.get();
    if (!snap.exists) return jsonError(404, "event_not_found");

    await ref.update({
      title: record.title.trim(),
      start: record.start,
      end: record.end,
      allDay: record.allDay,
      visibility: record.visibility,
      memo: record.memo.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, "server_error", msg);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ calendarId: string; eventId: string }> },
) {
  const { calendarId, eventId } = await ctx.params;
  try {
    const auth = await authenticateCalendar(calendarId, req);
    if (!auth.ok) {
      if (auth.reason === "not_found") return jsonError(404, auth.reason);
      return jsonError(401, auth.reason);
    }
    if (auth.role !== "edit") return jsonError(403, "forbidden");

    const db = getAdminFirestore();
    const ref = db.collection("calendars").doc(calendarId).collection("events").doc(eventId);
    const snap = await ref.get();
    if (!snap.exists) return jsonError(404, "event_not_found");

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, "server_error", msg);
  }
}
