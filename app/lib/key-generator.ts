
import { createHash } from "crypto";

// Generic key generator using MD5 hash of current timestamp (including seconds)
export function generateKey(prefix: string): string {
  // Use current date time to generate hash
  const now = new Date();
  const timestamp = now.toISOString(); // Includes seconds and milliseconds
  
  // Create MD5 hash
  const hash = createHash("md5").update(timestamp).digest("hex").toUpperCase();
  
  // Take first 12 characters
  const shortHash = hash.substring(0, 12);
  
  // Return formatted key
  return `${prefix}-${shortHash}`;
}

// Generate Roblox specific key: RB-{MD5}
export function generateRobloxKey(): string {
  return generateKey("RB");
}

// Generate Mod Menu specific key: GUM-{MD5}
export function generateModKey(): string {
  return generateKey("GUM");
}

// Helper function to get end of day in Vietnam timezone
export function getEndOfDayVN(): Date {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Set to 23:59:59.999 VN time
  vnTime.setHours(23, 59, 59, 999);
  
  return vnTime;
}
