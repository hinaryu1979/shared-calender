import fs from "fs";

function minifyJsonPreservingStrings(text) {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (!/\s/.test(c)) {
      out += c;
    }
  }
  return out;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/minify-env-json.mjs <pretty.json>");
  process.exit(1);
}

const content = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const jsonText =
  content.match(/FIREBASE_SERVICE_ACCOUNT_JSON=\s*(\{[\s\S]*\})/)?.[1] ??
  content.trim();
const oneLine = minifyJsonPreservingStrings(jsonText);
const envLine = `FIREBASE_SERVICE_ACCOUNT_JSON=${oneLine}`;
fs.writeFileSync(".env.local", `${envLine}\n`, "utf8");
console.log("Wrote .env.local");
console.log("chars:", envLine.length);
console.log("oauth2/auth:", oneLine.includes("oauth2/auth"));
console.log("fields:", [
  "type",
  "project_id",
  "private_key_id",
  "private_key",
  "client_email",
  "client_id",
  "auth_uri",
  "token_uri",
  "auth_provider_x509_cert_url",
  "client_x509_cert_url",
  "universe_domain",
].every((k) => oneLine.includes(`"${k}"`)));
