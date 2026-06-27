export function formatRangeForFilename(date: string): string {
  return date.replace(/-/g, "");
}

export function resolveExportFileName(startDate: string, endDate: string, fileName?: string): string {
  const trimmed = fileName?.trim();
  if (trimmed) return trimmed;
  return `共有カレンダー_${formatRangeForFilename(startDate)}_${formatRangeForFilename(endDate)}`;
}
