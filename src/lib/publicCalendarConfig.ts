/** クライアント用（NEXT_PUBLIC_* はビルド時に埋め込まれる） */
export const CALENDAR_ID = process.env.NEXT_PUBLIC_CALENDAR_ID ?? "";
export const EDIT_TOKEN = process.env.NEXT_PUBLIC_EDIT_TOKEN ?? "";

export const isFirebaseCalendarConfigured = Boolean(CALENDAR_ID && EDIT_TOKEN);
