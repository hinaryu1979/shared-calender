import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

config({ path: resolve(process.cwd(), ".env.local") });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw?.trim()) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON を .env.local に設定してから実行してください。");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(raw) as ServiceAccount),
});

const db = admin.firestore();

const calendarId = randomBytes(12).toString("hex");
const editToken = randomBytes(32).toString("hex");
const viewToken = randomBytes(32).toString("hex");

const MIN = new Date("2026-01-01T00:00:00");
const now = new Date();
const d = now >= MIN ? now : new Date("2026-05-15T12:00:00");
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
const dateStr = `${y}-${m}-${day}`;

async function main() {
  await db.collection("calendars").doc(calendarId).set({
    editToken,
    viewToken,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db
    .collection("calendars")
    .doc(calendarId)
    .collection("events")
    .doc(randomUUID())
    .set({
      title: "サンプル予定",
      start: `${dateStr}T18:00:00`,
      end: `${dateStr}T19:30:00`,
      allDay: false,
      visibility: "public",
      memo: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  console.log("\nFirestore にカレンダーを作成しました。次を .env.local に追記してください:\n");
  console.log(`NEXT_PUBLIC_CALENDAR_ID=${calendarId}`);
  console.log(`NEXT_PUBLIC_EDIT_TOKEN=${editToken}`);
  console.log(`NEXT_PUBLIC_VIEW_TOKEN=${viewToken}`);
  console.log("\n（閲覧用トークンはフェーズ4の閲覧URLで使用します）\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
