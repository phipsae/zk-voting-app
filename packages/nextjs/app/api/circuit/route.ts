import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Try multiple possible locations for the circuits.json file
    const possiblePaths = [
      // For Vercel deployment - check in the app directory
      path.resolve(process.cwd(), "app/_components/circuits.json"),
      // For local development - check in the circuits package
      path.resolve(process.cwd(), "../circuits/target/circuits.json"),
      // Alternative local path
      path.resolve(process.cwd(), "packages/circuits/target/circuits.json"),
    ];

    let data: string | null = null;
    let usedPath: string | null = null;

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          data = fs.readFileSync(filePath, "utf-8");
          usedPath = filePath;
          break;
        }
      } catch (err) {
        console.warn(`Failed to read from ${filePath}:`, err);
      }
    }

    if (!data) {
      console.error("Circuit data not found in any of the expected locations:", possiblePaths);
      return NextResponse.json({ error: "Circuit data not found" }, { status: 404 });
    }

    const parsedData = JSON.parse(data);
    console.log("Circuit data loaded from:", usedPath);
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error reading circuit data:", error);
    return NextResponse.json({ error: "Failed to fetch circuit data" }, { status: 500 });
  }
}
