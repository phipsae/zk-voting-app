import { NextResponse } from "next/server";
// Prefer bundled import (works on Vercel and locally)
// @ts-ignore - JSON import
import bundledCircuits from "../../_components/circuits.json";
import fs from "fs";
import path from "path";

// Ensure Node.js runtime so fs/path are available in all environments
export const runtime = "nodejs";

export async function GET() {
  try {
    // First, serve bundled JSON (ensures availability in serverless/edge-like envs)
    if (bundledCircuits) {
      return NextResponse.json(bundledCircuits);
    }

    // Fallback to filesystem lookups for local dev flexibility
    const possiblePaths = [
      path.resolve(process.cwd(), "app/_components/circuits.json"),
      path.resolve(process.cwd(), "../circuits/target/circuits.json"),
      path.resolve(process.cwd(), "packages/circuits/target/circuits.json"),
    ];

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(data);
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn(`Failed to read from ${filePath}:`, err);
      }
    }

    console.error("Circuit data not found in any of the expected locations:", possiblePaths);
    return NextResponse.json({ error: "Circuit data not found" }, { status: 404 });
  } catch (error) {
    console.error("Error reading circuit data:", error);
    return NextResponse.json({ error: "Failed to fetch circuit data" }, { status: 500 });
  }
}
