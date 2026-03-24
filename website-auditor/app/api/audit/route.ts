import { NextRequest, NextResponse } from "next/server";
import { scrapePage } from "@/lib/scraper";
import { analyzeWithAI } from "@/lib/aiAnalyzer";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // Parse request body 
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format. Please include https://" },
        { status: 400 }
      );
    }

    // Scrape the page 
    console.log(`[Audit] Scraping: ${url}`);
    const metrics = await scrapePage(url);

    //  Analyze with AI 
    console.log(`[Audit] Running AI analysis...`);
    const { insights, promptLog } = await analyzeWithAI(metrics);

    // Save prompt log to /prompt-logs
    try {
      const logDir = path.join(process.cwd(), "prompt-logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logFileName = `audit-${timestamp}.json`;
      const logPath = path.join(logDir, logFileName);

      const fullLog = {
        auditedUrl: url,
        auditedAt: new Date().toISOString(),
        metrics,
        promptLog,
        insights,
      };

      fs.writeFileSync(logPath, JSON.stringify(fullLog, null, 2));
      console.log(`[Audit] Prompt log saved: ${logFileName}`);
    } catch (logError) {
      // Non-fatal — log saving failure shouldn't break the response
      console.warn("[Audit] Could not save prompt log:", logError);
    }

    // Return combined result 
    return NextResponse.json({
      success: true,
      metrics,
      insights,
      promptLog,
    });
  } catch (error: unknown) {
    console.error("[Audit] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}