import admin from "firebase-admin";

let app: admin.app.App | undefined;

function getServiceAccountFromEnv(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。Firebase のサービスアカウント JSON を 1 行で設定してください。",
    );
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const projectId = parsed.project_id ?? parsed.projectId;
  const clientEmail = parsed.client_email ?? parsed.clientEmail;
  const privateKey = parsed.private_key ?? parsed.privateKey;
  if (typeof projectId !== "string" || typeof clientEmail !== "string" || typeof privateKey !== "string") {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON の形式が不正です。");
  }
  const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n");
  return {
    projectId,
    clientEmail,
    privateKey: normalizedPrivateKey,
  };
}

export function getFirebaseAdminApp(): admin.app.App {
  if (app) return app;
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const creds = getServiceAccountFromEnv();
  app = admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
  return app;
}

export function getAdminFirestore() {
  return getFirebaseAdminApp().firestore();
}
