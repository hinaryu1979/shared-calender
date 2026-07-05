import { google } from "googleapis";

/**
 * Sheets エクスポート用のサービスアカウント JSON を取得する。
 * 専用の GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON を優先し、
 * 無ければ Firebase 用の FIREBASE_SERVICE_ACCOUNT_JSON を流用する。
 */
function getSheetsServiceAccountRaw(): string | undefined {
  const dedicated = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if (dedicated?.trim()) return dedicated;
  const firebase = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (firebase?.trim()) return firebase;
  return undefined;
}

/** Sheets エクスポートが利用可能な設定になっているか（サーバー側判定） */
export function isSheetsExportConfigured(): boolean {
  if (process.env.GOOGLE_SHEETS_EXPORT_ENABLED !== "true") return false;
  return Boolean(getSheetsServiceAccountRaw());
}

function getServiceAccountFromEnv(): { clientEmail: string; privateKey: string } {
  const raw = getSheetsServiceAccountRaw();
  if (!raw?.trim()) {
    throw new Error(
      "Sheets エクスポート用のサービスアカウント JSON が未設定です。GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON もしくは FIREBASE_SERVICE_ACCOUNT_JSON を設定してください。",
    );
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const clientEmail = parsed.client_email ?? parsed.clientEmail;
  const privateKey = parsed.private_key ?? parsed.privateKey;
  if (typeof clientEmail !== "string" || typeof privateKey !== "string") {
    throw new Error("サービスアカウント JSON の形式が不正です。");
  }
  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getGoogleAuthClient(scopes: string[]) {
  const { clientEmail, privateKey } = getServiceAccountFromEnv();
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes,
  });
}
