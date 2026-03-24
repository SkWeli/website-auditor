import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedMetrics } from "./scraper";

export interface AIInsights {
  seoStructure: string;
  messagingClarity: string;
  ctaUsage: string;
  contentDepth: string;
  uxConcerns: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  priority: number;
  issue: string;
  action: string;
  reasoning: string;
}

export interface PromptLog {
  systemPrompt: string;
  userPrompt: string;
  fullRequest: object;
  rawModelOutput: string;
  parsedAt: string;
}

export interface AIAnalysisResult {
  insights: AIInsights;
  promptLog: PromptLog;
}

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeWithAI(
  metrics: ScrapedMetrics
): Promise<AIAnalysisResult> {
  // SYSTEM PROMPT 
  const systemPrompt = `You are a senior web strategist at a digital marketing agency 
specializing in SEO, conversion optimization, content clarity, and UX.

You will receive structured metrics extracted from a webpage along with a sample of its text content.

Your job is to analyze the data and return a JSON object with specific, grounded insights.

Rules:
- NEVER give generic advice like "add more headings" or "improve your SEO"
- ALWAYS reference specific numbers from the metrics (e.g. "With only 1 H1 and 0 H2s...")
- Be direct, specific, and actionable
- Insights must be grounded strictly in the data provided
- Return ONLY valid JSON, no markdown, no extra text`;

  // USER PROMPT 
  const userPrompt = `Analyze the following webpage audit data and return a structured JSON analysis.

URL: ${metrics.url}

EXTRACTED METRICS:
${JSON.stringify(
    {
      wordCount: metrics.wordCount,
      headings: metrics.headings,
      ctaCount: metrics.ctaCount,
      links: metrics.links,
      images: metrics.images,
      meta: metrics.meta,
    },
    null,
    2
  )}

PAGE CONTENT SAMPLE (first 3000 chars):
"${metrics.pageTextSample}"

Return a JSON object with exactly these keys:
{
  "seoStructure": "2-3 sentence analysis referencing H1/H2/H3 counts, meta title, meta description",
  "messagingClarity": "2-3 sentence analysis referencing word count and content sample",
  "ctaUsage": "2-3 sentence analysis referencing ctaCount and link counts",
  "contentDepth": "2-3 sentence analysis referencing word count",
  "uxConcerns": "2-3 sentence analysis referencing image alt text % and heading hierarchy",
  "recommendations": [
    {
      "priority": 1,
      "issue": "Short issue title",
      "action": "Specific action to take",
      "reasoning": "Why this matters, referencing the specific metric"
    }
  ]
}

Provide 3-5 recommendations ordered by priority (1 = most important).`;

  // FULL REQUEST OBJECT (logged for transparency) 
  const fullRequest = {
    model: "gemini-1.5-flash",
    systemPrompt,
    userPrompt,
  };

  // CALL THE MODEL 
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    } as object,
  });

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const geminiResponse = await model.generateContent(fullPrompt);
  const rawModelOutput = geminiResponse.response.text();

  // PARSE JSON
  let insights: AIInsights;
  try {
    insights = JSON.parse(rawModelOutput) as AIInsights;
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON: ${rawModelOutput}`
    );
  }

  // BUILD PROMPT LOG 
  const promptLog: PromptLog = {
    systemPrompt,
    userPrompt,
    fullRequest,
    rawModelOutput,
    parsedAt: new Date().toISOString(),
  };

  return { insights, promptLog };
}
