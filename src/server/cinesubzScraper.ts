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
//  PUPPETEER BROWSER LAUNCHER
//  Production (Heroku) → @sparticuz/chromium
//  Development (local)  → full puppeteer
// ============================================================
async function getBrowser() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');

    const execPath = await chromium.executablePath();
    console.log('[browser] chromium path:', execPath);

    return puppeteer.default.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless,
    });
  }

  const puppeteer = await import('puppeteer');
  return puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

// ============================================================
//  SEARCH — via Puppeteer (bypasses Cloudflare)
// ============================================================
export async function scrapeCineSubzMovies(query: string): Promise<SearchResultItem[]> {
  const q = (query || '').trim();
  if (!q) return [];

  const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(q)}`;
  const results: SearchResultItem[] = [];

  console.log('[search] Puppeteer GET', searchUrl);

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(UA);

    // Block heavy resources to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for JS to render search results
    await new Promise((r) => setTimeout(r, 3000));

    const items = await page.evaluate(() => {
      const out: Array<{
        title: string;
        link: string;
        image: string;
        quality: string;
        rating: string;
      }> = [];

      const articles = document.querySelectorAll(
        'article.item, article, .result-item, .item-movies, .item-tvshows'
      );

      articles.forEach((el) => {
        const titleEl =
          el.querySelector('.data .title a') ||
          el.querySelector('.data h3 a') ||
          el.querySelector('.title a') ||
          el.querySelector('h3 a') ||
          el.querySelector('h2 a') ||
          el.querySelector('.entry-title a');

        if (!titleEl) return;

        const title = (titleEl.textContent || '').trim();
        const link = titleEl.getAttribute('href') || '';

        const imgEl = el.querySelector('.poster img, .data img, img');
        const image =
          imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';

        const qualityEl = el.querySelector(
          '.quality, .item-quality, .meta .quality'
        );
        const quality = (qualityEl?.textContent || 'N/A').trim();

        const ratingEl = el.querySelector('.rating, .vote, .meta .rating');
        const ratingRaw = (ratingEl?.textContent || 'N/A').trim();
        const rating = ratingRaw.replace(/[★☆\s]/g, '') || 'N/A';

        if (title && link) {
          out.push({ title, link, image, quality, rating });
        }
      });

      return out;
    });

    console.log('[search] Puppeteer found:', items.length, 'items');

    for (const item of items) {
      const yearMatch = item.title.match(/\((\d{4})\)/);
      const year = yearMatch ? yearMatch[1] : undefined;

      let type: 'movie' | 'tvshows' = 'movie';
      if (
        item.link.includes('/tvshows/') ||
        item.title.toLowerCase().includes('tv series')
      ) {
        type = 'tvshows';
      }

      results.push({
        title: item.title,
        link: item.link,
        image: item.image,
        type,
        year,
        rating: item.rating,
        quality: item.quality,
      });
    }

    await browser.close();
    browser = undefined;

    console.log('[search] results:', results.length);
    return results;
  } catch (err) {
    console.error('[search] Puppeteer error:', err);
    if (browser) await browser.close().catch(() => {});
    return results;
  }
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

  let browser;
  try {
    browser = await getBrowser();
    console.log('[info] browser launched');

    const page = await browser.newPage();
    await page.setUserAgent(UA);

    const collectedDownloads: Array<{
      title: string;
      quality: string;
      size?: string;
      language?: string;
      link: string;
    }> = [];

    // Intercept JSON responses (zetaplayer / zetaflix)
    page.on('response', async (response) => {
      try {
        const url = response.url();
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        if (!url.includes('/wp-json/')) return;
        if (!url.includes('zetaplayer') && !url.includes('zetaflix')) return;

        const json = await response.json().catch(() => null);
        if (!json) return;

        console.log('[info] intercepted JSON:', url);

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

    // Extract metadata from DOM
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
        synopsis: pick([
          '.wp-content p',
          '[itemprop="description"]',
          '.story p',
          '.synopsis p',
        ]),
      };
    });

    // Click every "Download Links" button
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

    // Wait for AJAX to finish
    await new Promise((r) => setTimeout(r, 4000));

    // Try to detect WP nonce & postId from page
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

    // If nonce + postId available, hit zetaplayer directly
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
                  quality:
                    obj.quality || obj.resolution || obj.label || 'Download',
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
      synopsis: meta.synopsis || '',
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
//  TV INFO — Puppeteer
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

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(UA);

    await page.goto(tvUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const pick = (sels: string[]) => {
        for (const s of sels) {
          const el = document.querySelector(s);
          const t = el?.textContent?.trim();
          if (t) return t;
        }
        return '';
      };

      const title =
        pick([
          'h1.entry-title',
          '.sheader .data h1',
          'h1[itemprop="name"]',
          'h1',
        ]) || 'CineSubz TV';

      const rating = pick(['.rating', '[itemprop="ratingValue"]']) || 'N/A';
      const year = pick(['.year', '[itemprop="datePublished"]']);
      const synopsis = pick(['.wp-content p', '[itemprop="description"]']);

      const genre =
        Array.from(
          document.querySelectorAll('.genres a, [itemprop="genre"] a')
        )
          .map((el) => (el.textContent || '').trim())
          .filter(Boolean)
          .join(', ') || 'N/A';

      const episodes: Array<{
        episodeNumber: number;
        title: string;
        link: string;
      }> = [];

      document
        .querySelectorAll(
          '.episodios li, .episode, .se-c, .episode-list li, .episodes li'
        )
        .forEach((el, i) => {
          const a = el.querySelector('.episodiotitle a, a');
          if (!a) return;
          const epTitle = (a.textContent || '').trim() || `Episode ${i + 1}`;
          const epLink = a.getAttribute('href') || '';
          if (epLink) {
            episodes.push({
              episodeNumber: i + 1,
              title: epTitle,
              link: epLink,
            });
          }
        });

      return { title, rating, year, genre, synopsis, episodes };
    });

    await browser.close();
    browser = undefined;

    return {
      title: data.title,
      year: data.year || data.title.match(/\((\d{4})\)/)?.[1] || '—',
      genre: data.genre,
      rating: data.rating,
      seasons: 1,
      episodesCount: data.episodes.length,
      synopsis: data.synopsis,
      sourceUrl: tvUrl,
      episodes: data.episodes.map((ep) => ({
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        downloadLinks: [{ quality: 'Open Episode', link: ep.link }],
      })),
    };
  } catch (err) {
    console.error('[tv/info] puppeteer error:', err);
    if (browser) await browser.close().catch(() => {});
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
