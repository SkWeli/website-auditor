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

    const downloadReport = async () => {
    if (!result) return;

    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF();


    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color = "#000000") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      });
      y += 3;
    };

    const addDivider = () => {
      doc.setDrawColor("#e2e8f0");
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    doc.setFillColor("#0f172a");
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#ffffff");
    doc.text("Website Audit Report", margin, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#94a3b8");
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 30);
    y = 50;

    addText(`Audited URL: ${result.metrics.url}`, 10, false, "#3b82f6");
    addDivider();

    addText("FACTUAL METRICS", 13, true, "#000000");
    y += 2;

    const metrics = [
      ["Word Count", result.metrics.wordCount.toLocaleString()],
      ["H1 / H2 / H3", `${result.metrics.headings.h1} / ${result.metrics.headings.h2} / ${result.metrics.headings.h3}`],
      ["CTAs Found", String(result.metrics.ctaCount)],
      ["Internal Links", String(result.metrics.links.internal)],
      ["External Links", String(result.metrics.links.external)],
      ["Total Images", String(result.metrics.images.total)],
      ["Missing Alt Text", `${result.metrics.images.missingAlt} (${result.metrics.images.missingAltPercent})`],
      ["Meta Title", result.metrics.meta.title || "Not found"],
      ["Meta Description", result.metrics.meta.description || "Not found"],
    ];

    metrics.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#374151");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#111827");
      const lines = doc.splitTextToSize(value, contentWidth - 60);
      doc.text(lines, margin + 55, y);
      y += 7 * lines.length;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    y += 4;
    addDivider();
    addText("AI INSIGHTS", 13, true, "#000000");
    y += 2;

    const insights = [
      ["SEO Structure", result.insights.seoStructure],
      ["Messaging Clarity", result.insights.messagingClarity],
      ["CTA Usage", result.insights.ctaUsage],
      ["Content Depth", result.insights.contentDepth],
      ["UX Concerns", result.insights.uxConcerns],
    ];

    insights.forEach(([label, content]) => {
      addText(label, 11, true, "#1e40af");
      addText(content, 10, false, "#374151");
      y += 2;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    addDivider();
    addText("PRIORITIZED RECOMMENDATIONS", 13, true, "#000000");
    y += 2;

    result.insights.recommendations.forEach((rec) => {
      if (y > 250) { doc.addPage(); y = 20; }
      addText(`${rec.priority}. ${rec.issue}`, 11, true, "#dc2626");
      addText(`Action: ${rec.action}`, 10, false, "#374151");
      addText(`Why: ${rec.reasoning}`, 10, false, "#6b7280");
      y += 3;
    });

    const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor("#94a3b8");
      doc.text(`Website Auditor - Page ${i} of ${pageCount}`, margin, 290);
    }

    const filename = `audit-${new URL(result.metrics.url).hostname}-${Date.now()}.pdf`;
    doc.save(filename);
  };


  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28,
              background: "var(--ink)",
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
              color: "#fff",
              fontWeight: 700,
            }}>
              A
            </div>
            <span style={{
              fontWeight: 600,
              fontSize: 14,
              color: "var(--ink)",
              letterSpacing: "-0.2px",
            }}>
              Website Auditor
            </span>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-3)",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            padding: "4px 12px",
            borderRadius: 20,
            letterSpacing: "0.3px",
          }}>
            Powered by Gemini 2.5 Flash
          </span>
        </div>
      </header>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px 64px" }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: "0 0 16px",
          }}>
            SEO and UX Analysis
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(34px, 5vw, 52px)",
            fontWeight: 400,
            color: "var(--ink)",
            margin: "0 0 18px",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            maxWidth: 580,
          }}>
            Understand what your <em>webpage</em> is really saying
          </h1>
          <p style={{
            fontSize: 15,
            color: "var(--ink-3)",
            margin: "0 0 36px",
            lineHeight: 1.7,
            maxWidth: 500,
            fontWeight: 400,
          }}>
            Paste any URL and get factual SEO metrics alongside AI-generated insights
            grounded in real page data.
          </p>

          <div style={{ display: "flex", gap: 10, maxWidth: 600 }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAudit()}
              placeholder="https://example.com"
              style={{
                flex: 1,
                background: "var(--bg)",
                border: "1px solid var(--border-dark)",
                borderRadius: "var(--radius-sm)",
                padding: "13px 16px",
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--font-body)",
                outline: "none",
                boxShadow: "var(--shadow-sm)",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-dark)";
                e.target.style.boxShadow = "var(--shadow-sm)";
              }}
            />
            <button
              onClick={handleAudit}
              disabled={loading || !url}
              style={{
                background: loading || !url ? "var(--surface-3)" : "var(--ink)",
                color: loading || !url ? "var(--ink-4)" : "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "13px 28px",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: loading || !url ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Auditing..." : "Run Audit"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px 80px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 32, height: 32,
              border: "2px solid var(--border)",
              borderTop: "2px solid var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
              Scraping page and running AI analysis...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--danger-light)",
            border: "1px solid var(--danger-border)",
            borderLeft: "3px solid var(--danger)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 18px",
            fontSize: 13,
            color: "var(--danger)",
            marginBottom: 32,
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Download Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <button
                onClick={downloadReport}
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                Download Report
              </button>
            </div>


            {/* FACTUAL METRICS */}
            <section style={{ paddingBottom: 56, marginBottom: 56, borderBottom: "1px solid var(--border)" }}>
              <SectionHeader
                tag="Factual Metrics"
                tagColor="var(--success)"
                tagBg="var(--success-light)"
                tagBorder="var(--success-border)"
                title="What we found on the page"
                sub="Extracted directly, no AI involvement"
              />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                marginBottom: 12,
                background: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}>
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
                  value={result.metrics.meta.title ? "Present" : "Missing"}
                  highlight={!result.metrics.meta.title}
                />
              </div>

              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}>
                <MetaRow label="Meta Title" value={result.metrics.meta.title} />
                <div style={{ borderTop: "1px solid var(--border)" }} />
                <MetaRow label="Meta Description" value={result.metrics.meta.description} />
              </div>
            </section>

            {/* AI INSIGHTS */}
            <section style={{ paddingBottom: 56, marginBottom: 56, borderBottom: "1px solid var(--border)" }}>
              <SectionHeader
                tag="AI Insights"
                tagColor="var(--accent)"
                tagBg="var(--accent-light)"
                tagBorder="var(--accent-border)"
                title="What the AI observed"
                sub="Generated by Gemini 2.5 Flash, grounded in the metrics above"
              />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
                marginBottom: 28,
              }}>
                <InsightCard label="SEO" title="SEO Structure" content={result.insights.seoStructure} />
                <InsightCard label="MSG" title="Messaging Clarity" content={result.insights.messagingClarity} />
                <InsightCard label="CTA" title="CTA Usage" content={result.insights.ctaUsage} />
                <InsightCard label="CNT" title="Content Depth" content={result.insights.contentDepth} />
                <InsightCard label="UX" title="UX Concerns" content={result.insights.uxConcerns} span={2} />
              </div>

              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                margin: "0 0 12px",
              }}>
                Prioritized Recommendations
              </p>
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}>
                {result.insights.recommendations.map((rec: Recommendation, index: number) => (
                  <RecommendationCard key={index} rec={rec} />
                ))}
              </div>
            </section>

            {/* PROMPT LOG */}
            <section>
              <button
                onClick={() => setShowPromptLog(!showPromptLog)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: showPromptLog ? 16 : 0,
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}>
                  Prompt Log
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {showPromptLog ? "Hide" : "Show"} AI reasoning trace
                </span>
              </button>

              {showPromptLog && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <LogBlock title="System Prompt" content={result.promptLog.systemPrompt} />
                  <LogBlock title="Constructed User Prompt" content={result.promptLog.userPrompt} />
                  <LogBlock title="Raw Model Output (before parsing)" content={result.promptLog.rawModelOutput} />
                  <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0 }}>
                    Analyzed at: {result.promptLog.parsedAt}
                  </p>
                </div>
              )}
            </section>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>
          Website Auditor. AI-powered SEO and UX analysis.
        </p>
      </footer>

    </main>
  );
}


function SectionHeader({ tag, tagColor, tagBg, tagBorder, title, sub }: {
  tag: string; tagColor: string; tagBg: string; tagBorder: string; title: string; sub: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <span style={{
        display: "inline-block",
        fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
        color: tagColor, background: tagBg, border: `1px solid ${tagBorder}`,
        padding: "3px 10px", borderRadius: 20, marginBottom: 12,
      }}>
        {tag}
      </span>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400,
        color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.3px", lineHeight: 1.2,
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>{sub}</p>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: {
  label: string; value: string | number; highlight?: boolean;
}) {
  return (
    <div style={{ background: highlight ? "var(--danger-light)" : "var(--bg)", padding: "18px 20px" }}>
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
        color: highlight ? "var(--danger)" : "var(--ink-4)", margin: "0 0 8px",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400,
        color: highlight ? "var(--danger)" : "var(--ink)", margin: 0, letterSpacing: "-0.3px", lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ padding: "14px 20px", background: "var(--bg)", display: "flex", gap: 24, alignItems: "baseline" }}>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
        color: "var(--ink-4)", flexShrink: 0, width: 120,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: value ? "var(--ink-2)" : "var(--danger)", lineHeight: 1.5 }}>
        {value || "Not found"}
      </span>
    </div>
  );
}

function InsightCard({ label, title, content, span = 1 }: {
  label: string; title: string; content: string; span?: number;
}) {
  return (
    <div style={{
      background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "20px 22px",
      gridColumn: span === 2 ? "span 2" : undefined,
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "1px",
          color: "var(--accent)", background: "var(--accent-light)",
          border: "1px solid var(--accent-border)", padding: "2px 7px", borderRadius: 4,
        }}>
          {label}
        </span>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{title}</p>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
        {content}
      </p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg: Record<number, { color: string; bg: string; label: string }> = {
    1: { color: "#c0392b", bg: "var(--danger-light)",       label: "P1" },
    2: { color: "#c05621", bg: "#fff7ed",                   label: "P2" },
    3: { color: "#92400e", bg: "#fffbeb",                   label: "P3" },
    4: { color: "var(--accent)", bg: "var(--accent-light)", label: "P4" },
    5: { color: "var(--ink-3)", bg: "var(--surface-1)",     label: "P5" },
  };
  const c = cfg[rec.priority] || cfg[5];

  return (
    <div style={{
      background: "var(--bg)", padding: "18px 22px",
      display: "flex", gap: 16, alignItems: "flex-start",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: "0.5px",
        color: c.color, background: c.bg, padding: "3px 8px",
        borderRadius: 4, flexShrink: 0, marginTop: 2,
      }}>
        {c.label}
      </span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>{rec.issue}</p>
        <p style={{ fontSize: 13, color: "var(--accent)", margin: "0 0 4px", fontWeight: 400 }}>{rec.action}</p>
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{rec.reasoning}</p>
      </div>
    </div>
  );
}

function LogBlock({ title, content }: { title: string; content: string }) {
  return (
    <div style={{
      background: "var(--surface-1)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", overflow: "hidden",
    }}>
      <div style={{
        borderBottom: "1px solid var(--border)", padding: "8px 16px",
        fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
        color: "var(--ink-3)", background: "var(--surface-2)",
      }}>
        {title}
      </div>
      <pre style={{
        padding: "16px", fontSize: 12, color: "var(--ink-3)",
        overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.65, margin: 0,
        fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
        background: "var(--surface-1)",
      }}>
        {content}
      </pre>
    </div>
  );
}
