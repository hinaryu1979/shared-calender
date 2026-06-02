import { MIN_EVENT_DATE } from "@/lib/calendarConstants";

export type EventFormPayload = {
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  visibility: "public" | "private";
  memo: string;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

const minStart = new Date(`${MIN_EVENT_DATE}T00:00:00`);

export function validateEventPayload(p: EventFormPayload): ValidationResult {
  const t = p.title.trim();
  if (!t) return { ok: false, message: "タイトルを入力してください。" };

  if (p.allDay) {
    if (!p.start || !p.end) return { ok: false, message: "開始日・終了日を入力してください。" };
    const [ys, ms, ds] = p.start.split("-").map(Number);
    const [ye, me, de] = p.end.split("-").map(Number);
    if (!ys || !ye) return { ok: false, message: "日付の形式が正しくありません。" };
    const s = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
    const e = new Date(ye, me - 1, de, 0, 0, 0, 0);
    if (s < minStart) return { ok: false, message: `開始日は ${MIN_EVENT_DATE} 以降にしてください。` };
    if (e < s) return { ok: false, message: "終了日は開始日以降にしてください。" };
    return { ok: true };
  }

  if (!p.start || !p.end) return { ok: false, message: "開始・終了の日時を入力してください。" };
  const s = new Date(p.start);
  const e = new Date(p.end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return { ok: false, message: "日時の形式が正しくありません。" };
  }
  if (s < minStart) return { ok: false, message: `開始は ${MIN_EVENT_DATE} 0:00 以降にしてください。` };
  if (e <= s) return { ok: false, message: "終了は開始より後にしてください。" };
  return { ok: true };
}
