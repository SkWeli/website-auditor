# Website Auditor

An AI-powered website audit tool built for the Eight25Media engineering assessment. Paste a URL and get instant factual metrics + AI-generated insights on SEO, messaging, CTAs, content depth, and UX.

**[Live Demo →](https://website-auditor-neon.vercel.app/)**

---

## Features

- Extracts factual metrics directly from the page (no AI involved in data collection)
- Uses Gemini 2.5 Flash to generate grounded, specific insights tied to real numbers
- Full prompt logs visible in the UI and saved to `/prompt-logs` on every audit
- Clean separation between scraping layer and AI analysis layer

---

## Architecture Overview

User Input (URL)
       ↓
POST /api/audit  ── Next.js API Route
       ↓
┌─────────────────────────────────────┐
│        Scraping Layer               │
│        lib/scraper.ts               │
│                                     │
│  -  Cheerio parses raw HTML          │
│  -  Extracts: word count, headings,  │
│    CTAs, links, images, alt text,   │
│    meta title, meta description     │
│  -  Zero AI involvement              │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│          AI Layer                   │
│          lib/aiAnalyzer.ts          │
│                                     │
│  -  Scraped metrics injected into    │
│    structured prompt                │
│  -  Gemini 2.5 Flash called with     │
│    JSON response mode               │
│  -  Raw output captured before       │
│    parsing (logged)                 │
│  -  Model fallback chain on quota    │
└──────────────────┬──────────────────┘
                   ↓
     { metrics, insights, promptLog }
                   ↓
┌─────────────────────────────────────┐
│         Frontend                    │
│         app/page.tsx                │
│                                     │
│  -  Factual Metrics panel            │
│  -  AI Insights panel                │
│  -  Collapsible Prompt Log panel     │
└─────────────────────────────────────┘




---

## AI Design Decisions

### 1. Strict separation between scraping and AI
All metrics are extracted in pure code before the AI is involved. The AI never scrapes — it only receives structured data. This makes the insights verifiable and prevents hallucinated metrics.

### 2. Metrics-grounded prompting
The system prompt explicitly forbids generic advice and requires the model to cite specific numbers from the extracted data (e.g. *"With only 1 H1 and 0 H2s..."*). This is enforced in the prompt itself, not just hoped for.

### 3. Structured JSON output
Gemini is called with `responseMimeType: "application/json"` to enforce valid JSON responses every time. This eliminates fragile regex parsing and makes the output reliable enough to render directly in the UI.

### 4. Low temperature (0.4)
A temperature of 0.4 balances consistency (important for structured output) with enough flexibility to produce varied, non-robotic language across different audits.

### 5. Full prompt logging
Every audit saves the system prompt, constructed user prompt, full request payload, and raw model output — before any parsing. This gives full visibility into the AI layer and makes debugging straightforward.

---

## Trade-offs

Decision - Trade-off 

Cheerio over Puppeteer - Cheerio is fast and lightweight but can't render JavaScript. Pages that load content dynamically (SPAs) will return incomplete metrics. 
Single page only - Keeps the tool focused and fast. Multi-page crawling would require a queue system and significantly more complexity. 
Gemini 2.5 Flash - Free tier with 20 RPD limit. Sufficient for this assessment but would need a paid tier for production use. 
Client-side fetch - Simpler architecture but means CORS issues could arise for some URLs. A server-side proxy (already implemented via API route) handles this cleanly. 
No caching - Every audit hits the live page and AI model. Adding Redis caching for repeat URLs would reduce latency and API costs. 

---

## What I'd Improve With More Time

- **JavaScript rendering** — Use Puppeteer or Playwright to handle SPAs and dynamically loaded content
- **Audit scoring** — Generate a 0–100 score per category so users can track improvements over time
- **Multi-page crawl** — Extend the tool to audit up to 5 pages and surface site-wide patterns
- **Caching** — Cache audit results by URL + timestamp to reduce redundant API calls
- **Export** — Allow users to download the full audit as a PDF report
- **History** — Save past audits to compare before/after changes

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Scraping:** Cheerio
- **AI:** Google Gemini 2.5 Flash via `@google/generative-ai`
- **Deployment:** Vercel

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/website-auditor.git
cd website-auditor

# 2. Install dependencies
npm install

# 3. Add environment variables
cp .env.local
(GEMINI_API_KEY=Google Gemini API key)
# Add your Gemini API key to .env.local

# 4. Run the dev server
npm run dev

# 5. Open http://localhost:3000
```
## Prompt Logs
Full prompt logs from example audit runs are available in /prompt-logs. Each log includes:

System prompt used
Constructed user prompt with injected metrics
Full request payload sent to the model
Raw model output before parsing
