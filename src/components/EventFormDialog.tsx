"use client";

import { useId, useState } from "react";
import { MIN_EVENT_DATE } from "@/lib/calendarConstants";
import type { EventFormPayload } from "@/lib/eventValidation";
import { validateEventPayload } from "@/lib/eventValidation";

export type EventFormDialogProps = {
  mode: "create" | "edit";
  editingId: string | null;
  initial: EventFormPayload;
  onClose: () => void;
  onCreate: (payload: EventFormPayload) => void | Promise<void>;
  onUpdate: (id: string, payload: EventFormPayload) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

export function EventFormDialog({
  mode,
  editingId,
  initial,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: EventFormDialogProps) {
  const titleId = useId();
  const [title, setTitle] = useState(initial.title);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startDate, setStartDate] = useState(() =>
    initial.allDay ? initial.start.slice(0, 10) : "",
  );
  const [endDate, setEndDate] = useState(() => (initial.allDay ? initial.end.slice(0, 10) : ""));
  const [startDateTime, setStartDateTime] = useState(() => (initial.allDay ? "" : initial.start));
  const [endDateTime, setEndDateTime] = useState(() => (initial.allDay ? "" : initial.end));
  const [visibility, setVisibility] = useState(initial.visibility);
  const [memo, setMemo] = useState(initial.memo);
  const [error, setError] = useState<string | null>(null);

  function buildPayload(): EventFormPayload {
    if (allDay) {
      return {
        title,
        allDay: true,
        start: startDate,
        end: endDate,
        visibility,
        memo,
      };
    }
    return {
      title,
      allDay: false,
      start: startDateTime,
      end: endDateTime,
      visibility,
      memo,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    const v = validateEventPayload(payload);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    setError(null);
    try {
      if (mode === "create") await Promise.resolve(onCreate(payload));
      else if (editingId) await Promise.resolve(onUpdate(editingId, payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!window.confirm("この予定を削除しますか？")) return;
    try {
      await Promise.resolve(onDelete(editingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-2 sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900">
            {mode === "create" ? "予定を追加" : "予定を編集"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">開始は {MIN_EVENT_DATE} 以降のみ</p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {error ? (
              <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">タイトル（必須）</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
                autoComplete="off"
                required
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (next) {
                    const s = startDateTime ? startDateTime.slice(0, 10) : startDate || MIN_EVENT_DATE;
                    const eDay = endDateTime ? endDateTime.slice(0, 10) : endDate || s;
                    setStartDate(s);
                    setEndDate(eDay >= s ? eDay : s);
                  } else {
                    const base = startDate || MIN_EVENT_DATE;
                    setStartDateTime(`${base}T12:00`);
                    setEndDateTime(`${base}T13:00`);
                  }
                  setAllDay(next);
                }}
                className="size-4 rounded border-zinc-300"
              />
              終日
            </label>

            {allDay ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">開始日（必須）</span>
                  <input
                    type="date"
                    min={MIN_EVENT_DATE}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
                    required
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">終了日（必須・含む）</span>
                  <input
                    type="date"
                    min={startDate || MIN_EVENT_DATE}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
                    required
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">開始（必須）</span>
                  <input
                    type="datetime-local"
                    min={`${MIN_EVENT_DATE}T00:00`}
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">終了（必須）</span>
                  <input
                    type="datetime-local"
                    min={startDateTime || `${MIN_EVENT_DATE}T00:00`}
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
                    required
                  />
                </label>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-medium text-zinc-600">公開設定（必須）</legend>
              <label className="flex items-center gap-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="size-4 border-zinc-300"
                />
                公開（閲覧URLでも詳細表示）
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="size-4 border-zinc-300"
                />
                非公開（閲覧URLでは「予定あり」のみ）
              </label>
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">メモ（任意）</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-blue-500/40 focus:ring-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              onClick={onClose}
            >
              キャンセル
            </button>
            {mode === "edit" && editingId ? (
              <button
                type="button"
                className="ml-auto rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                削除
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

/** フォーム用：終了日は「含む」。FC 保存用レコードへ変換は親で行う。 */