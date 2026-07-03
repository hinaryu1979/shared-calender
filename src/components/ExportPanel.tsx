"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { exportCalendarToSheets } from "@/lib/calendarApi";
import { formatDateLocal } from "@/lib/dateTimeLocal";
import { CALENDAR_ID, EDIT_TOKEN } from "@/lib/publicCalendarConfig";

const MOBILE_MQ = "(max-width: 767px)";

type Props = {
  disabled?: boolean;
};

function defaultStartDate(): string {
  const now = new Date();
  return formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
}

function defaultEndDate(): string {
  const now = new Date();
  return formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

export function ExportPanel({ disabled = false }: Props) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const showForm = !isMobile || open;

  const handleExport = useCallback(async () => {
    setError(null);
    setResultUrl(null);
    setResultFileName(null);
    if (startDate > endDate) {
      setError("開始日は終了日以前にしてください。");
      if (window.matchMedia(MOBILE_MQ).matches) setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const result = await exportCalendarToSheets(CALENDAR_ID, EDIT_TOKEN, {
        startDate,
        endDate,
        fileName: fileName.trim() || undefined,
      });
      setResultUrl(result.url);
      setResultFileName(result.fileName);
      if (window.matchMedia(MOBILE_MQ).matches) setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      if (window.matchMedia(MOBILE_MQ).matches) setOpen(true);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, fileName]);

  return (
    <div className="shrink-0 border-t border-zinc-200/80 bg-white">
      {isMobile ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={formId}
          className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <span className="font-medium">エクスポート</span>
          <span aria-hidden="true">{open ? "△" : "▽"}</span>
        </button>
      ) : null}
      {showForm ? (
        <div id={formId} className="px-3 pb-3 pt-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              開始日
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={disabled || loading}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              終了日
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled || loading}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
              />
            </label>
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-zinc-600">
              ファイル名
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="未入力時は自動生成"
                disabled={disabled || loading}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={disabled || loading}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {loading ? "エクスポート中…" : "Googleスプレッドシートへエクスポート"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
          {resultUrl ? (
            <p className="mt-2 text-xs text-zinc-700">
              エクスポート完了:{" "}
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 underline hover:text-blue-900"
              >
                {resultFileName ?? resultUrl}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
