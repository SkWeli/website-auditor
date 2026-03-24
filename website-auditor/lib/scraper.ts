import * as cheerio from "cheerio";

export interface ScrapedMetrics {
  url: string;
  wordCount: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
  };
  ctaCount: number;
  links: {
    internal: number;
    external: number;
  };
  images: {
    total: number;
    missingAlt: number;
    missingAltPercent: string;
  };
  meta: {
    title: string | null;
    description: string | null;
  };
  pageTextSample: string;
}

const CTA_KEYWORDS = [
  "get started",
  "sign up",
  "start",
  "buy",
  "order",
  "subscribe",
  "download",
  "try",
  "book",
  "contact",
  "request",
  "learn more",
  "get a quote",
  "schedule",
  "join",
  "register",
  "claim",
];

export async function scrapePage(url: string): Promise<ScrapedMetrics> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WebsiteAuditor/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // --- Word Count ---
  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").filter((w) => w.length > 0).length;

  // --- Headings ---
  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
  };

  // --- CTAs ---
  let ctaCount = 0;
  $("button, a").each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    const isCTA = CTA_KEYWORDS.some((keyword) => text.includes(keyword));
    if (isCTA) ctaCount++;
  });

  // --- Internal vs External Links ---
  const inputDomain = new URL(url).hostname;
  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      href.startsWith("/") ||
      href.startsWith("#") ||
      href.includes(inputDomain)
    ) {
      internalLinks++;
    } else if (href.startsWith("http")) {
      externalLinks++;
    }
  });

  // --- Images ---
  const totalImages = $("img").length;
  let missingAlt = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || alt.trim() === "") missingAlt++;
  });
  const missingAltPercent =
    totalImages > 0
      ? ((missingAlt / totalImages) * 100).toFixed(1) + "%"
      : "0%";

  // --- Meta Tags ---
  const metaTitle = $("title").first().text() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content") || null;

  // --- Page Text Sample for AI ---
  const pageTextSample = bodyText.slice(0, 3000);

  return {
    url,
    wordCount,
    headings,
    ctaCount,
    links: {
      internal: internalLinks,
      external: externalLinks,
    },
    images: {
      total: totalImages,
      missingAlt,
      missingAltPercent,
    },
    meta: {
      title: metaTitle,
      description: metaDescription,
    },
    pageTextSample,
  };
}