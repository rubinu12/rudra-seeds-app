// src/app/test-db/page.tsx
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export default async function TestDBPage() {
  let message = "";
  let time = "";

  try {
    // Try to get the current time from the database
    const result = await sql`SELECT NOW() as time`;
    time = result.rows[0].time.toString();
    message = "✅ Database Connected Successfully!";
  } catch (e: any) {
    message = "❌ Database Connection FAILED";
    time = e.message; // This will show the real error on screen
  }

  return (
    <div className="p-10 font-mono text-center">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <div
        className={`p-4 rounded border ${
          message.includes("FAILED")
            ? "bg-red-100 border-red-500 text-red-700"
            : "bg-green-100 border-green-500 text-green-700"
        }`}
      >
        <p className="font-bold">{message}</p>
        <p className="mt-2 text-sm">{time}</p>
      </div>
    </div>
  );
}