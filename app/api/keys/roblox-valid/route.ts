import { NextResponse } from 'next/server';

export async function GET() {
  // In a real application, you would fetch all currently valid keys from your database.
  // For this demo, we return a list of static and potential dynamic keys.
  
  const keys = [
    "KEY-123",
    "KEY-TEST",
    "ROBLOX-DEV",
    "GUMBALLZ-ADMIN",
    // You could also return keys that were recently generated and stored in a DB
  ];

  // Join them with newlines or return as raw text, depending on what GumballZ-UI-Lib expects.
  // Most Lua libs expect raw text with one key per line, or a JSON array.
  // I'll return raw text to be safe.
  
  return new NextResponse(keys.join("\n"), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
