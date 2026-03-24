"use client";

import { useState } from "react";
import { AIInsights, PromptLog, Recommendation } from "@/lib/aiAnalyzer";
import { ScrapedMetrics } from "@/lib/scraper";

interface AuditResult {
  metrics: ScrapedMetrics;
  insights: AIInsights;
  promptLog: PromptLog;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPromptLog, setShowPromptLog] = useState(false);

  const handleAudit = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed.");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Website Auditor</h1>
            <p className="text-xs text-gray-400">AI-powered SEO & UX analysis</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* URL Input */}
        <div className="mb-10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter a URL to audit
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAudit()}
              placeholder="https://example.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleAudit}
              disabled={loading || !url}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Auditing..." : "Run Audit"}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Scraping page and running AI analysis...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-5 py-4 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/*FACTUAL METRICS */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded">
                  FACTUAL METRICS
                </span>
                <span className="text-xs text-gray-500">Extracted directly from the page — no AI</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Word Count" value={result.metrics.wordCount.toLocaleString()} />
                <MetricCard label="H1 / H2 / H3" value={`${result.metrics.headings.h1} / ${result.metrics.headings.h2} / ${result.metrics.headings.h3}`} />
                <MetricCard label="CTAs Found" value={result.metrics.ctaCount} />
                <MetricCard label="Internal Links" value={result.metrics.links.internal} />
                <MetricCard label="External Links" value={result.metrics.links.external} />
                <MetricCard label="Total Images" value={result.metrics.images.total} />
                <MetricCard
                  label="Missing Alt Text"
                  value={`${result.metrics.images.missingAlt} (${result.metrics.images.missingAltPercent})`}
                  highlight={result.metrics.images.missingAlt > 0}
                />
                <MetricCard
                  label="Meta Title"
                  value={result.metrics.meta.title ? "✓ Present" : "✗ Missing"}
                  highlight={!result.metrics.meta.title}
                />
              </div>

              {/* Meta details */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Meta Title</span>
                  <p className="text-white mt-0.5">{result.metrics.meta.title || <span className="text-red-400">Not found</span>}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Meta Description</span>
                  <p className="text-white mt-0.5">{result.metrics.meta.description || <span className="text-red-400">Not found</span>}</p>
                </div>
              </div>
            </section>

            {/* AI INSIGHTS */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold bg-blue-900/50 text-blue-400 border border-blue-800 px-2 py-0.5 rounded">
                  AI INSIGHTS
                </span>
                <span className="text-xs text-gray-500">Generated by GPT-4o, grounded in metrics above</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <InsightCard title="SEO Structure" content={result.insights.seoStructure} icon="🔍" />
                <InsightCard title="Messaging Clarity" content={result.insights.messagingClarity} icon="💬" />
                <InsightCard title="CTA Usage" content={result.insights.ctaUsage} icon="🎯" />
                <InsightCard title="Content Depth" content={result.insights.contentDepth} icon="📄" />
                <InsightCard title="UX Concerns" content={result.insights.uxConcerns} icon="⚠️" className="md:col-span-2" />
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Prioritized Recommendations</h3>
                <div className="space-y-3">
                  {result.insights.recommendations.map((rec: Recommendation) => (
                    <RecommendationCard key={rec.priority} rec={rec} />
                  ))}
                </div>
              </div>
            </section>

            {/* PROMPT LOG */}
            <section>
              <button
                onClick={() => setShowPromptLog(!showPromptLog)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">
                  PROMPT LOG
                </span>
                <span>{showPromptLog ? "▲ Hide" : "▼ Show"} AI reasoning trace</span>
              </button>

              {showPromptLog && (
                <div className="mt-4 space-y-4">
                  <LogBlock title="System Prompt" content={result.promptLog.systemPrompt} />
                  <LogBlock title="Constructed User Prompt" content={result.promptLog.userPrompt} />
                  <LogBlock title="Raw Model Output (before parsing)" content={result.promptLog.rawModelOutput} />
                  <div className="text-xs text-gray-500">Analyzed at: {result.promptLog.parsedAt}</div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

// Sub-components

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "bg-red-900/20 border-red-800" : "bg-gray-800/50 border-gray-700"}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function InsightCard({
  title,
  content,
  icon,
  className = "",
}: {
  title: string;
  content: string;
  icon: string;
  className?: string;
}) {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-200 mb-2">{icon} {title}</h4>
      <p className="text-sm text-gray-300 leading-relaxed">{content}</p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const priorityColors: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-blue-500",
    5: "bg-gray-500",
  };
  const color = priorityColors[rec.priority] || "bg-gray-500";

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex gap-4">
      <div className={`${color} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
        {rec.priority}
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-0.5">{rec.issue}</p>
        <p className="text-sm text-blue-300 mb-1">→ {rec.action}</p>
        <p className="text-xs text-gray-400">{rec.reasoning}</p>
      </div>
    </div>
  );
}

function LogBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 border-b border-gray-700">
        {title}
      </div>
      <pre className="p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
