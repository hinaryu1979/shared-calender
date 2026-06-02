"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import type { DateSelectArg, DateSpanApi, EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from "@/lib/calendarApi";
import { MIN_EVENT_DATE } from "@/lib/calendarConstants";
import type { CalendarEventRecord } from "@/lib/calendarEventTypes";
import { toEventInput } from "@/lib/calendarEventTypes";
import { EventFormDialog } from "@/components/EventFormDialog";
import { eventApiToRecord } from "@/lib/eventApiBridge";
import {
  formPayloadToFcStrings,
  payloadToFormInitialAllDay,
  payloadToFormInitialTimed,
  recordToFormInitial,
} from "@/lib/eventFormConverters";
import { formatDateLocal, formatDateTimeLocal } from "@/lib/dateTimeLocal";
import type { EventFormPayload } from "@/lib/eventValidation";
import { CALENDAR_ID, EDIT_TOKEN, isFirebaseCalendarConfigured } from "@/lib/publicCalendarConfig";

const MOBILE_MQ = "(max-width: 767px)";

const MIN_EVENT_START = new Date(`${MIN_EVENT_DATE}T00:00:00`);

const useRemoteApi = isFirebaseCalendarConfigured;

function getInitialView(): "dayGridMonth" | "timeGridWeek" | "timeGridDay" {
  if (typeof window === "undefined") return "timeGridWeek";
  return window.matchMedia(MOBILE_MQ).matches ? "timeGridWeek" : "dayGridMonth";
}

function initialSampleEvents(): CalendarEventRecord[] {
  const now = new Date();
  const d = now >= MIN_EVENT_START ? now : new Date("2026-05-15T12:00:00");
  const date = formatDateLocal(d);
  return [
    {
      id: crypto.randomUUID(),
      title: "サンプル予定",
      start: `${date}T18:00:00`,
      end: `${date}T19:30:00`,
      allDay: false,
      visibility: "public",
      memo: "",
    },
  ];
}

function defaultCreatePayload(): EventFormPayload {
  const now = new Date();
  const floor = new Date(`${MIN_EVENT_DATE}T12:00:00`);
  let start = new Date(Math.max(now.getTime(), floor.getTime()));
  start.setSeconds(0, 0);
  start.setMinutes(0, 0);
  if (start.getTime() <= now.getTime()) {
    start = new Date(start.getTime() + 60 * 60 * 1000);
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    allDay: false,
    start: formatDateTimeLocal(start),
    end: formatDateTimeLocal(end),
    visibility: "public",
    memo: "",
  };
}

function recordFromPayload(id: string, payload: EventFormPayload): CalendarEventRecord {
  const { start, end, allDay } = formPayloadToFcStrings(payload);
  return {
    id,
    title: payload.title.trim(),
    start,
    end,
    allDay,
    visibility: payload.visibility,
    memo: payload.memo.trim(),
  };
}

export default function AppCalendar() {
  const [events, setEvents] = useState<CalendarEventRecord[]>(() =>
    useRemoteApi ? [] : initialSampleEvents(),
  );
  const [remoteLoading, setRemoteLoading] = useState(useRemoteApi);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogInitial, setDialogInitial] = useState<EventFormPayload>(() => defaultCreatePayload());

  const initialDateStr = useMemo(() => {
    const t = new Date();
    return t >= MIN_EVENT_START ? formatDateLocal(t) : "2026-05-15";
  }, []);

  const fcEvents = useMemo(() => events.map(toEventInput), [events]);

  const loadRemote = useCallback(async () => {
    if (!useRemoteApi) return;
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const list = await fetchCalendarEvents(CALENDAR_ID, EDIT_TOKEN);
      setEvents(list);
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseCalendarConfigured) return;
    queueMicrotask(() => {
      void loadRemote();
    });
  }, [loadRemote]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  const openCreateBlank = useCallback(() => {
    setDialogMode("create");
    setEditingId(null);
    setDialogInitial(defaultCreatePayload());
    setDialogOpen(true);
  }, []);

  const handleSelect = useCallback((info: DateSelectArg) => {
    info.view.calendar.unselect();
    if (info.start < MIN_EVENT_START) {
      window.alert(`選択の開始は ${MIN_EVENT_DATE} 以降にしてください。`);
      return;
    }
    setDialogMode("create");
    setEditingId(null);
    if (info.allDay) {
      setDialogInitial(payloadToFormInitialAllDay(info.start, info.end));
    } else {
      setDialogInitial(payloadToFormInitialTimed(info.start, info.end));
    }
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      info.jsEvent.preventDefault();
      const r = events.find((e) => e.id === String(info.event.id));
      if (!r) return;
      setDialogMode("edit");
      setEditingId(r.id);
      setDialogInitial(recordToFormInitial(r));
      setDialogOpen(true);
    },
    [events],
  );

  const handleCreate = useCallback(
    async (payload: EventFormPayload) => {
      if (useRemoteApi) {
        try {
          const created = await createCalendarEvent(CALENDAR_ID, EDIT_TOKEN, payload);
          setEvents((prev) => [...prev, created]);
          closeDialog();
        } catch (e) {
          window.alert(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      const id = crypto.randomUUID();
      setEvents((prev) => [...prev, recordFromPayload(id, payload)]);
      closeDialog();
    },
    [closeDialog],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: EventFormPayload) => {
      const next = recordFromPayload(id, payload);
      if (useRemoteApi) {
        try {
          await updateCalendarEvent(CALENDAR_ID, EDIT_TOKEN, next);
          setEvents((prev) => prev.map((r) => (r.id === id ? next : r)));
          closeDialog();
        } catch (e) {
          window.alert(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      setEvents((prev) => prev.map((r) => (r.id === id ? next : r)));
      closeDialog();
    },
    [closeDialog],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (useRemoteApi) {
        try {
          await deleteCalendarEvent(CALENDAR_ID, EDIT_TOKEN, id);
          setEvents((prev) => prev.filter((r) => r.id !== id));
          closeDialog();
        } catch (e) {
          window.alert(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      setEvents((prev) => prev.filter((r) => r.id !== id));
      closeDialog();
    },
    [closeDialog],
  );

  const handleEventChange = useCallback(
    (info: EventDropArg | EventResizeDoneArg) => {
      const start = info.event.start;
      if (start && start < MIN_EVENT_START) {
        info.revert();
        window.alert(`予定の開始は ${MIN_EVENT_DATE} 以降にしてください。`);
        return;
      }
      const rec = eventApiToRecord(info.event);
      void (async () => {
        if (useRemoteApi) {
          try {
            await updateCalendarEvent(CALENDAR_ID, EDIT_TOKEN, rec);
            setEvents((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
          } catch (e) {
            info.revert();
            window.alert(e instanceof Error ? e.message : String(e));
          }
          return;
        }
        setEvents((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
      })();
    },
    [],
  );

  const allowFromMin2026 = useCallback((span: DateSpanApi) => span.start >= MIN_EVENT_START, []);

  return (
    <div className="fc-root flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      {!useRemoteApi ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Firebase 未設定のため、この端末だけに保存されます。`.env.local` に{" "}
          <code className="rounded bg-amber-100/80 px-1">FIREBASE_SERVICE_ACCOUNT_JSON</code> と{" "}
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_CALENDAR_ID</code>、
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_EDIT_TOKEN</code> を設定し、
          <code className="rounded bg-amber-100/80 px-1">npm run seed:calendar</code> でカレンダーを作成してください。
        </div>
      ) : null}
      {useRemoteApi && remoteError ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
          <span className="min-w-0 flex-1">読み込み失敗: {remoteError}</span>
          <button
            type="button"
            className="shrink-0 rounded border border-red-300 bg-white px-2 py-1 text-red-800"
            onClick={() => void loadRemote()}
          >
            再試行
          </button>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-zinc-200/80 bg-white px-2 py-1.5">
        <button
          type="button"
          onClick={openCreateBlank}
          disabled={useRemoteApi && remoteLoading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          予定を追加
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {useRemoteApi && remoteLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-zinc-600">
            読み込み中…
          </div>
        ) : null}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={jaLocale}
          timeZone="Asia/Tokyo"
          initialView={getInitialView()}
          initialDate={initialDateStr}
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "今日",
            month: "月",
            week: "週",
            day: "日",
          }}
          height="100%"
          expandRows
          dayMaxEvents
          nowIndicator
          slotMinTime="06:00:00"
          slotMaxTime="23:59:00"
          scrollTime="08:00:00"
          allDayText="終日"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            omitZeroMinute: false,
            meridiem: "short",
          }}
          events={fcEvents}
          dayMaxEventRows={3}
          selectable
          selectMirror
          select={handleSelect}
          selectAllow={allowFromMin2026}
          eventClick={handleEventClick}
          editable
          eventStartEditable
          eventDurationEditable
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventAllow={allowFromMin2026}
        />
      </div>

      {dialogOpen ? (
        <EventFormDialog
          mode={dialogMode}
          editingId={editingId}
          initial={dialogInitial}
          onClose={closeDialog}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}
