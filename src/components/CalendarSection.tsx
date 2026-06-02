"use client";

import dynamic from "next/dynamic";

const AppCalendar = dynamic(() => import("@/components/AppCalendar"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#f8f9fa] text-sm text-zinc-500">
      読み込み中…
    </div>
  ),
});

export function CalendarSection() {
  return <AppCalendar />;
}
