import { createDecipheriv, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type CommunityAccount = { username: string; password: string };

let accountCache: Promise<CommunityAccount[]> | undefined;

export async function readCommunityAccounts(): Promise<CommunityAccount[]> {
  if (accountCache) return accountCache;
  const filePath = path.join(process.cwd(), "private-data", "league-accounts.txt.enc");
  accountCache = readFile(filePath).then((encrypted) => {
    const key = process.env.COMMUNITY_ACCOUNTS_ENCRYPTION_KEY;
    if (!key) throw new Error("COMMUNITY_ACCOUNTS_ENCRYPTION_KEY is not configured");
    const keyBytes = Buffer.from(key, "base64");
    if (keyBytes.length !== 32 || encrypted.length < 33 || encrypted.subarray(0, 5).toString("ascii") !== "GZCA1") {
      throw new Error("Community account file or encryption key is invalid");
    }
    const decipher = createDecipheriv("aes-256-gcm", keyBytes, encrypted.subarray(5, 17));
    decipher.setAuthTag(encrypted.subarray(17, 33));
    return Buffer.concat([decipher.update(encrypted.subarray(33)), decipher.final()]).toString("utf8");
  }).then((contents) => contents.split(/\r?\n/).flatMap((line) => {
      const separator = line.indexOf("|");
      if (separator < 1) return [];
      const username = line.slice(0, separator).trim();
      const password = line.slice(separator + 1).trim();
      return username && password ? [{ username, password }] : [];
    })).catch((error) => { accountCache = undefined; throw error; });
  return accountCache;
}

export function accountsForTransaction(accounts: CommunityAccount[], transactionId: string, quantity: number) {
  if (!accounts.length) return [];
  const count = Math.max(1, Math.min(50, quantity));
  const start = createHash("sha256").update(transactionId).digest().readUInt32BE(0) % accounts.length;
  return Array.from({ length: count }, (_, index) => accounts[(start + index) % accounts.length]);
}
