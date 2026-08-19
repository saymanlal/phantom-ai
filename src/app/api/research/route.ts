import { NextRequest, NextResponse } from 'next/server';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  qualityScore: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    // Multi-source live search query via DuckDuckGo HTML & Public Search APIs
    const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Search request failed with status ${res.status}`);
    }

    const html = await res.text();
    const results: WebSearchResult[] = [];

    // Parse DuckDuckGo standard HTML search response structure
    const linkRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const titleSnippetRegex = /<a class="result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

    const matches = [...html.matchAll(titleSnippetRegex)].slice(0, 10);

    for (const match of matches) {
      const rawUrl = match[1];
      const snippet = match[2].replace(/<[^>]+>/g, '').trim();

      // Decode URL if formatted via uddg redirect
      let actualUrl = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        actualUrl = decodeURIComponent(uddgMatch[1]);
      }

      let domain = 'web';
      try {
        domain = new URL(actualUrl).hostname;
      } catch {}

      if (snippet && actualUrl.startsWith('http')) {
        results.push({
          title: snippet.slice(0, 60) + '...',
          url: actualUrl,
          snippet,
          source: domain,
          qualityScore: domain.includes('gov') || domain.includes('edu') || domain.includes('nasscom') ? 0.95 : 0.85,
        });
      }
    }

    return NextResponse.json({
      query,
      resultsCount: results.length,
      results,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Failed to fetch live search results',
      details: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
