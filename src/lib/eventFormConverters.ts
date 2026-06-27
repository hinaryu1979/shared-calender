import {
  addLocalDays,
  formatDateLocal,
  formatDateTimeLocal,
  parseDateLocal,
} from "@/lib/dateTimeLocal";
import type { EventFormPayload } from "@/lib/eventValidation";

export function payloadToFormInitialTimed(start: Date, end: Date): EventFormPayload {
  return {
    title: "",
    allDay: false,
    start: formatDateTimeLocal(start),
    end: formatDateTimeLocal(end),
    visibility: "public",
    memo: "",
  };
}

/** 日付セルクリック時: 開始日=終了日=クリック日、時刻・タイトル・メモは空 */
export function payloadToFormInitialDateClick(date: Date): EventFormPayload {
  const d = formatDateLocal(date);
  return {
    title: "",
    allDay: true,
    start: d,
    end: d,
    visibility: "public",
    memo: "",
  };
}

export function payloadToFormInitialAllDay(startInclusive: Date, endExclusive: Date): EventFormPayload {
  const s = formatDateLocal(startInclusive);
  const endInclusive = addLocalDays(endExclusive, -1);
  const e = formatDateLocal(endInclusive);
  return {
    title: "",
    allDay: true,
    start: s,
    end: e,
    visibility: "public",
    memo: "",
  };
}

export function recordToFormInitial(r: {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  visibility: "public" | "private";
  memo: string;
}): EventFormPayload {
  if (r.allDay) {
    const start = r.start.slice(0, 10);
    const endExclusive = parseDateLocal(r.end.slice(0, 10));
    const endInclusive = addLocalDays(endExclusive, -1);
    return {
      title: r.title,
      allDay: true,
      start,
      end: formatDateLocal(endInclusive),
      visibility: r.visibility,
      memo: r.memo,
    };
  }
  return {
    title: r.title,
    allDay: false,
    start: formatDateTimeLocal(new Date(r.start)),
    end: formatDateTimeLocal(new Date(r.end)),
    visibility: r.visibility,
    memo: r.memo,
  };
}

export function formPayloadToFcStrings(payload: EventFormPayload): { start: string; end: string; allDay: boolean } {
  if (payload.allDay) {
    const s = payload.start.slice(0, 10);
    const eIn = parseDateLocal(payload.end.slice(0, 10));
    const eEx = addLocalDays(eIn, 1);
    return { start: s, end: formatDateLocal(eEx), allDay: true };
  }
  return {
    start: payload.start,
    end: payload.end,
    allDay: false,
  };
}
