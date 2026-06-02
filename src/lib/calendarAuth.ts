import { getAdminFirestore } from "@/lib/firebase-admin";
import { safeEqualString } from "@/lib/secureEqual";

export type CalendarAuthRole = "edit" | "view";

export type CalendarAuthResult =
  | { ok: true; role: CalendarAuthRole }
  | { ok: false; reason: "missing_token" | "not_found" | "invalid_token" };

type CalendarSecrets = {
  editToken: string;
  viewToken: string;
};

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = m?.[1]?.trim();
  return token || null;
}

export async function authenticateCalendar(calendarId: string, req: Request): Promise<CalendarAuthResult> {
  const token = extractBearerToken(req);
  if (!token) return { ok: false, reason: "missing_token" };

  const db = getAdminFirestore();
  const snap = await db.collection("calendars").doc(calendarId).get();
  if (!snap.exists) return { ok: false, reason: "not_found" };

  const data = snap.data() as Partial<CalendarSecrets>;
  const editToken = typeof data.editToken === "string" ? data.editToken : "";
  const viewToken = typeof data.viewToken === "string" ? data.viewToken : "";

  if (safeEqualString(token, editToken)) return { ok: true, role: "edit" };
  if (safeEqualString(token, viewToken)) return { ok: true, role: "view" };
  return { ok: false, reason: "invalid_token" };
}
