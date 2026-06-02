import { CalendarSection } from "@/components/CalendarSection";

export default function Home() {
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#f8f9fa] text-zinc-900">
      <header className="flex shrink-0 items-center border-b border-zinc-200/80 bg-white px-3 py-2 shadow-sm">
        <h1 className="text-base font-medium tracking-tight">共有カレンダー</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col p-1 sm:p-2">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-sm">
          <CalendarSection />
        </div>
      </main>
    </div>
  );
}
