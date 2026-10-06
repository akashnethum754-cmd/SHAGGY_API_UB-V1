import * as cheerio from 'cheerio';

export interface SearchResultItem {
  title: string;
  link: string;
  image: string;
  type: 'movie' | 'tvshows';
  year?: string;
  rating?: string;
  quality?: string;
}

export interface MovieInfoResult {
  title: string;
  image?: string;
  year: string;
  genre: string;
  rating?: string;
  duration?: string;
  director?: string;
  cast?: string[];
  synopsis?: string;
  sourceUrl?: string;
  downloads: Array<{
    title: string;
    quality: string;
    size?: string;
    language?: string;
    link: string;
  }>;
}

export interface TVSeriesInfoResult {
  title: string;
  year: string;
  genre: string;
  rating?: string;
  episodesCount: number;
  seasons?: number;
  synopsis?: string;
  sourceUrl?: string;
  episodes?: Array<{
    episodeNumber: number;
    title: string;
    downloadLinks: Array<{
      quality: string;
      link: string;
    }>;
  }>;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ============================================================
//  PUPPETEER HELPERS (dynamic import — only used when needed)
// ============================================================
async function getBrowser() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    // Heroku / Lambda — use @sparticuz/chromium
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');

    return puppeteer.default.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Local dev — try full puppeteer first, fallback to system chrome
    try {
      const puppeteer = await import('puppeteer');
      return puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch {
      const puppeteer = await import('puppeteer-core');
      return puppeteer.default.launch({
        headless: true,
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH ||
          '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }
}

// ============================================================
//  SEARCH — real scrape
// ============================================================
export async function scrapeCineSubzMovies(query: string): Promise<SearchResultItem[]> {
  const q = (query || '').trim();
  if (!q) return [];

  const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(q)}`;
  const results: SearchResultItem[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    console.log('[search] GET', searchUrl);

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    console.log('[search] status:', res.status);
    if (!res.ok) return results;

    const html = await res.text();
    console.log('[search] html length:', html.length);

    const $ = cheerio.load(html);

    $('article.item, article, .result-item, .item-movies, .item-tvshows').each((_, el) => {
      const titleEl = $(el)
        .find('.data .title a, .data h3 a, .title a, h3 a, h2 a, .entry-title a')
        .first();
      const title = titleEl.text().trim();
      const link = titleEl.attr('href') || '';

      const image =
        $(el).find('.poster img, .data img, img').first().attr('src') ||
        $(el).find('img').first().attr('data-src') ||
        '';

      const quality =
        $(el).find('.quality, .item-quality, .meta .quality').first().text().trim() || 'N/A';

      const ratingRaw =
        $(el).find('.rating, .vote, .meta .rating').first().text().trim() || 'N/A';
      const rating = ratingRaw.replace(/[★☆\s]/g, '') || 'N/A';

      const yearMatch = title.match(/\((\d{4})\)/);
      const year = yearMatch ? yearMatch[1] : undefined;

      let type: 'movie' | 'tvshows' = 'movie';
      if (link.includes('/tvshows/') || title.toLowerCase().includes('tv series')) {
        type = 'tvshows';
      }

      if (title && link) {
        results.push({ title, link, image, type, year, rating, quality });
      }
    });

    console.log('[search] results:', results.length);
  } catch (err) {
    console.error('[search] error:', err);
  }

  return results;
}

export async function scrapeCineSubzTVSearch(query: string): Promise<SearchResultItem[]> {
  const all = await scrapeCineSubzMovies(query);
  return all.filter((r) => r.type === 'tvshows');
}

// ============================================================
//  MOVIE INFO + DOWNLOADS — Puppeteer + network interception
// ============================================================
export async function scrapeCineSubzMovieInfo(
  targetUrlOrQuery: string
): Promise<MovieInfoResult> {
  const q = (targetUrlOrQuery || '').trim();
  if (!q) {
    return {
      title: 'No query',
      year: '—',
      genre: '—',
      downloads: [],
    };
  }

  // Resolve query → real movie URL via search
  let movieUrl = q;
  if (!q.startsWith('http')) {
    const search = await scrapeCineSubzMovies(q);
    const first = search.find((r) => r.type === 'movie') || search[0];
    if (first) {
      movieUrl = first.link;
      console.log('[info] resolved →', movieUrl);
    } else {
      const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(q)}`;
      return {
        title: `${q} — No results on CineSubz`,
        year: '—',
        genre: '—',
        sourceUrl: searchUrl,
        downloads: [
          {
            title: '🔍 Open CineSubz Search',
            quality: 'Browsable',
            size: 'N/A',
            link: searchUrl,
          },
        ],
      };
    }
  }

  // ---------- PUPPETEER: launch browser & intercept downloads ----------
  let browser;
  try {
    browser = await getBrowser();
    console.log('[info] browser launched');

    const page = await browser.newPage();
    await page.setUserAgent(UA);

    // Collected downloads from intercepted JSON responses
    const collectedDownloads: Array<{
      title: string;
      quality: string;
      size?: string;
      language?: string;
      link: string;
    }> = [];

    // Intercept JSON responses that look like download lists
    page.on('response', async (response) => {
      try {
        const url = response.url();
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        if (!url.includes('/wp-json/')) return;

        // Only interested in zetaplayer / zetaflix
        if (!url.includes('zetaplayer') && !url.includes('zetaflix')) return;

        const json = await response.json().catch(() => null);
        if (!json) return;

        console.log('[info] intercepted JSON:', url);

        // Walk the JSON tree looking for download-like objects
        const walk = (obj: any) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach(walk);
            return;
          }
          if (typeof obj === 'object') {
            const link = obj.link || obj.url || obj.href || obj.download;
            if (typeof link === 'string' && link.startsWith('http')) {
              const quality =
                obj.quality || obj.resolution || obj.label || obj.title || 'Download';
              const size = obj.size || obj.filesize || 'N/A';
              const language = obj.language || obj.lang || 'English';
              collectedDownloads.push({
                title: obj.title || quality,
                quality,
                size,
                language,
                link,
              });
            }
            Object.values(obj).forEach(walk);
          }
        };
        walk(json);
      } catch {
        /* ignore */
      }
    });

    console.log('[info] goto', movieUrl);
    await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // ---------- Extract basic metadata from DOM ----------
    const meta = await page.evaluate(() => {
      const pick = (sels: string[]) => {
        for (const s of sels) {
          const el = document.querySelector(s);
          const t = el?.textContent?.trim();
          if (t) return t;
        }
        return '';
      };
      const pickAttr = (sels: string[], attr: string) => {
        for (const s of sels) {
          const el = document.querySelector(s) as HTMLImageElement | null;
          const v = el?.getAttribute(attr);
          if (v) return v;
        }
        return '';
      };

      return {
        title: pick([
          'h1.entry-title',
          '.sheader .data h1',
          'h1[itemprop="name"]',
          'h1',
        ]),
        image: pickAttr(
          ['.poster img', '.sheader .poster img', 'img[itemprop="image"]'],
          'src'
        ),
        rating: pick(['.rating', '[itemprop="ratingValue"]', '.vote']),
        year: pick(['.year', '[itemprop="datePublished"]']),
        duration: pick(['.runtime', '[itemprop="duration"]', '.duration']),
        director: pick(['.director a', '[itemprop="director"] a']),
      };
    });

    // ---------- Click every "Download Links" button ----------
    const clickSelectors = [
      'text/Direct & Telegram Download Links',
      'a:has-text("Download")',
      'button:has-text("Download")',
      '.download-btn',
      '#download-links-btn',
    ];

    for (const sel of clickSelectors) {
      try {
        const handles = await page.$$(sel);
        for (const h of handles) {
          await h.click({ delay: 50 }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    // Wait a bit for AJAX responses
    await new Promise((r) => setTimeout(r, 4000));

    // ---------- Also try to extract nonce & hit API manually ----------
    const wpConfig = await page.evaluate(() => {
      const w: any = window as any;
      return {
        nonce:
          w?.wpApiSettings?.nonce ||
          w?.wp?.apiSettings?.nonce ||
          w?.zetaplayer?.nonce ||
          w?.zetaflix?.nonce ||
          null,
        root:
          w?.wpApiSettings?.root ||
          w?.wp?.apiSettings?.root ||
          'https://cinesubz.net/wp-json/',
        postId:
          w?.zetaplayer?.postId ||
          w?.zetaflix?.postId ||
          w?.postId ||
          null,
      };
    });
    console.log('[info] wpConfig:', wpConfig);

    // If we got a nonce & postId, hit zetaplayer directly
    if (wpConfig.nonce && wpConfig.postId) {
      try {
        const apiUrl = `${wpConfig.root}zetaplayer/v2/movies/${wpConfig.postId}`;
        const r = await fetch(apiUrl, {
          headers: {
            'User-Agent': UA,
            'X-WP-Nonce': wpConfig.nonce,
            Accept: 'application/json',
          },
        });
        if (r.ok) {
          const j = await r.json();
          console.log('[info] zetaplayer direct OK');
          const walk = (obj: any) => {
            if (!obj) return;
            if (Array.isArray(obj)) return obj.forEach(walk);
            if (typeof obj === 'object') {
              const link = obj.link || obj.url || obj.href || obj.download;
              if (typeof link === 'string' && link.startsWith('http')) {
                collectedDownloads.push({
                  title: obj.title || obj.quality || 'Download',
                  quality: obj.quality || obj.resolution || obj.label || 'Download',
                  size: obj.size || obj.filesize || 'N/A',
                  language: obj.language || obj.lang || 'English',
                  link,
                });
              }
              Object.values(obj).forEach(walk);
            }
          };
          walk(j);
        }
      } catch (e) {
        console.log('[info] zetaplayer direct failed:', e);
      }
    }

    await browser.close();
    browser = undefined;

    // ---------- Build final result ----------
    const downloads = collectedDownloads.filter(
      (d, i, self) => i === self.findIndex((x) => x.link === d.link)
    );

    console.log('[info] total downloads:', downloads.length);

    return {
      title: meta.title || 'CineSubz Movie',
      image: meta.image || undefined,
      year: meta.year || '—',
      genre: 'N/A',
      rating: meta.rating || 'N/A',
      duration: meta.duration || 'N/A',
      director: meta.director || 'N/A',
      cast: [],
      synopsis: '',
      sourceUrl: movieUrl,
      downloads:
        downloads.length > 0
          ? downloads
          : [
              {
                title: '🔍 Open CineSubz Page (no direct links captured)',
                quality: 'Browsable',
                size: 'N/A',
                link: movieUrl,
              },
            ],
    };
  } catch (err) {
    console.error('[info] puppeteer error:', err);
    if (browser) await browser.close().catch(() => {});
    return {
      title: `${q} — CineSubz`,
      year: '—',
      genre: '—',
      sourceUrl: movieUrl,
      downloads: [
        {
          title: '🔍 Open CineSubz Page',
          quality: 'Browsable',
          size: 'N/A',
          link: movieUrl,
        },
      ],
    };
  }
}

// ============================================================
//  TV INFO — basic scrape (Puppeteer-lite)
// ============================================================
export async function scrapeCineSubzTVInfo(
  targetUrlOrQuery: string
): Promise<TVSeriesInfoResult> {
  const q = (targetUrlOrQuery || '').trim();
  if (!q) {
    return { title: 'No query', year: '—', genre: '—', episodesCount: 0 };
  }

  let tvUrl = q;
  if (!q.startsWith('http')) {
    const results = await scrapeCineSubzTVSearch(q);
    if (results.length > 0) {
      tvUrl = results[0].link;
    } else {
      const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(q)}`;
      return {
        title: `${q} — No TV results`,
        year: '—',
        genre: '—',
        episodesCount: 0,
        sourceUrl: searchUrl,
        episodes: [],
      };
    }
  }

  try {
    const res = await fetch(tvUrl, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('h1.entry-title, .sheader .data h1, h1[itemprop="name"]').first().text().trim() ||
      'CineSubz TV';

    const rating =
      $('.rating, [itemprop="ratingValue"]').first().text().trim() || 'N/A';

    const year =
      $('.year, [itemprop="datePublished"]').first().text().trim() ||
      title.match(/\((\d{4})\)/)?.[1] ||
      '—';

    const genre =
      $('.genres a, [itemprop="genre"] a')
        .map((_, el) => $(el).text().trim())
        .get()
        .join(', ') || 'N/A';

    const synopsis =
      $('.wp-content p, [itemprop="description"]').first().text().trim() || '';

    const episodes: Array<{
      episodeNumber: number;
      title: string;
      downloadLinks: Array<{ quality: string; link: string }>;
    }> = [];

    $('.episodios li, .episode, .se-c, .episode-list li, .episodes li').each((i, el) => {
      const epTitle =
        $(el).find('.episodiotitle a, a').first().text().trim() || `Episode ${i + 1}`;
      const epLink = $(el).find('a').first().attr('href') || '';
      if (epLink) {
        episodes.push({
          episodeNumber: i + 1,
          title: epTitle,
          downloadLinks: [{ quality: 'Open Episode', link: epLink }],
        });
      }
    });

    return {
      title,
      year,
      genre,
      rating,
      seasons: 1,
      episodesCount: episodes.length,
      synopsis,
      sourceUrl: tvUrl,
      episodes,
    };
  } catch (err) {
    console.error('[tv/info] error:', err);
    return {
      title: `${q} — CineSubz`,
      year: '—',
      genre: '—',
      episodesCount: 0,
      sourceUrl: tvUrl,
      episodes: [],
    };
  }
}
