import { google } from "googleapis";

function getServiceAccountFromEnv(): { clientEmail: string; privateKey: string } {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。Google API 利用にはサービスアカウント JSON が必要です。",
    );
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const clientEmail = parsed.client_email ?? parsed.clientEmail;
  const privateKey = parsed.private_key ?? parsed.privateKey;
  if (typeof clientEmail !== "string" || typeof privateKey !== "string") {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON の形式が不正です。");
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
