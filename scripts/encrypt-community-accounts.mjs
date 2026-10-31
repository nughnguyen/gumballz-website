import { createCipheriv, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
let envText = await readFile(envPath, "utf8").catch(() => "");
const envLine = envText.split(/\r?\n/).find((line) => line.startsWith("COMMUNITY_ACCOUNTS_ENCRYPTION_KEY="));
let key = process.env.COMMUNITY_ACCOUNTS_ENCRYPTION_KEY || envLine?.slice("COMMUNITY_ACCOUNTS_ENCRYPTION_KEY=".length).trim();
if (!key) {
  key = randomBytes(32).toString("base64");
  envText = `${envText}${envText && !envText.endsWith("\n") ? "\n" : ""}COMMUNITY_ACCOUNTS_ENCRYPTION_KEY=${key}\n`;
  await writeFile(envPath, envText, { mode: 0o600 });
  console.log("Generated an encryption key in .env.local. Add that value to the hosting provider as a Secret before deploying.");
}

const keyBytes = Buffer.from(key, "base64");
if (keyBytes.length !== 32) throw new Error("COMMUNITY_ACCOUNTS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");

const plaintextPath = path.join(root, "private-data", "league-accounts.txt");
const encryptedPath = `${plaintextPath}.enc`;
const nonce = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", keyBytes, nonce);
const plaintext = await readFile(plaintextPath);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const envelope = Buffer.concat([Buffer.from("GZCA1"), Buffer.from(nonce), cipher.getAuthTag(), ciphertext]);
await writeFile(encryptedPath, envelope);
console.log(`Encrypted ${plaintext.length} bytes into private-data/league-accounts.txt.enc`);
