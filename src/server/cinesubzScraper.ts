import * as cheerio from 'cheerio';

export interface SearchResultItem {
  title: string;
  link: string;
  image: string;
  type: 'movie' | 'tvshows';
  year?: string;
}

export interface MovieInfoResult {
  title: string;
  year?: string;
  genre?: string;
  rating?: string;
  duration?: string;
  synopsis?: string;
  image?: string;
  sourceUrl: string;
}

export interface TVSeriesInfoResult {
  title: string;
  year?: string;
  genre?: string;
  rating?: string;
  synopsis?: string;
  image?: string;
  episodes: Array<{ title: string; url: string }>;
  sourceUrl: string;
}

export class ScraperError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

const ALLOWED_HOSTS = new Set(['cinesubz.net', 'www.cinesubz.net', 'cinesubz.lk', 'www.cinesubz.lk']);
const MOVIE_BASE = 'https://cinesubz.net';
const TV_BASE = 'https://cinesubz.lk';
const TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 2_000_000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Simple in-memory cache (5 min) to cut load on the source site
const cache = new Map<string, { at: number; html: string }>();
const CACHE_MS = 5 * 60 * 1000;

/** Only allow https URLs on the known hosts (prevents SSRF). */
export function assertAllowedUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new ScraperError('Invalid URL', 400);
  }
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname)) {
    throw new ScraperError('URL host is not allowed', 400);
  }
  return u;
}

async function fetchHtml(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.html;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // redirect: 'manual' so a redirect can't escape the host whitelist
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new ScraperError('Bad redirect from source');
      const next = assertAllowedUrl(new URL(loc, url).toString());
      return fetchHtml(next.toString());
    }
    if (!res.ok) throw new ScraperError(`Source site responded ${res.status}`);
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    if (cache.size > 200) cache.clear();
    cache.set(url, { at: Date.now(), html });
    return html;
  } catch (e: any) {
    if (e instanceof ScraperError) throw e;
    if (e?.name === 'AbortError') throw new ScraperError('Source site timed out', 504);
    throw new ScraperError('Could not reach source site');
  } finally {
    clearTimeout(timer);
  }
}

const abs = (href: string | undefined, base: string) => {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
};

function parseResults(html: string, base: string, type: 'movie' | 'tvshows'): SearchResultItem[] {
  const $ = cheerio.load(html);
  const out: SearchResultItem[] = [];
  const seen = new Set<string>();

  $('.result-item, article.item, .item-movies, .item-shows').each((_, el) => {
    const a = $(el).find('.title a, h3 a, .entry-title a').first();
    const title = a.text().trim();
    const link = abs(a.attr('href'), base);
    if (!title || !link || seen.has(link)) return;
    const img = $(el).find('img').first();
    seen.add(link);
    out.push({
      title,
      link,
      image: abs(img.attr('data-src') || img.attr('src'), base),
      type,
      year: $(el).find('.year, .meta .date').first().text().trim() || undefined,
    });
  });
  return out;
}

export async function scrapeCineSubzMovies(query: string): Promise<SearchResultItem[]> {
  const html = await fetchHtml(`${MOVIE_BASE}/?s=${encodeURIComponent(query)}`);
  return parseResults(html, MOVIE_BASE, 'movie');
}

export async function scrapeCineSubzTVSearch(query: string): Promise<SearchResultItem[]> {
  const html = await fetchHtml(`${TV_BASE}/?s=${encodeURIComponent(query)}`);
  return parseResults(html, TV_BASE, 'tvshows');
}

function parseCommon($: cheerio.CheerioAPI, url: string) {
  const title = $('h1.entry-title, .data h1, .sheader .data h1, h1').first().text().trim();
  if (!title) throw new ScraperError('Could not find a title on that page (layout may have changed)', 404);
  return {
    title,
    year: $('.date, .year').first().text().trim() || undefined,
    genre:
      $('.sgeneros a, .genres a')
        .map((_, a) => $(a).text().trim())
        .get()
        .join(', ') || undefined,
    rating: $('.dt_rating_vgs, .rating').first().text().trim() || undefined,
    synopsis: $('.wp-content p, .entry-content p').first().text().trim() || undefined,
    image: abs($('.poster img, .sheader img').first().attr('src'), url) || undefined,
    sourceUrl: url,
  };
}

export async function scrapeCineSubzMovieInfo(targetUrl: string): Promise<MovieInfoResult> {
  const u = assertAllowedUrl((targetUrl || '').trim());
  const $ = cheerio.load(await fetchHtml(u.toString()));
  return {
    ...parseCommon($, u.toString()),
    duration: $('.runtime').first().text().trim() || undefined,
  };
}

export async function scrapeCineSubzTVInfo(targetUrl: string): Promise<TVSeriesInfoResult> {
  const u = assertAllowedUrl((targetUrl || '').trim());
  const $ = cheerio.load(await fetchHtml(u.toString()));
  const episodes: Array<{ title: string; url: string }> = [];
  $('.episodios li, .episodes li').each((_, li) => {
    const a = $(li).find('a').first();
    const url = abs(a.attr('href'), u.toString());
    const title = a.text().trim();
    if (url && title) episodes.push({ title, url });
  });
  return { ...parseCommon($, u.toString()), episodes };
}
