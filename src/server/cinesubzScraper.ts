import * as cheerio from 'cheerio';

export interface SearchResultItem {
  title: string;
  image: string;
  type: 'movies' | 'tvshows';
  quality: string;
  rating: string;
  link: string;
}

export interface MovieInfoResult {
  title: string;
  image?: string;
  quality?: string;
  rating?: string;
  imdb?: string;
  director?: string;
  language?: string;
  genres?: string[];
  story?: string;
  cast?: Array<{ name: string; role: string; image?: string }>;
  gallery?: string[];
  trailer?: string;
  year?: string;
  duration?: string;
  tag?: string;
  directors?: string;
  stars?: string;
  country?: string;
  sourceUrl?: string;
  downloads: Array<{
    quality: string;
    size: string;
    language: string;
    link: string;
  }>;
}

export interface TVSeriesInfoResult {
  title: string;
  image?: string;
  quality?: string;
  rating?: string;
  year?: string;
  genre?: string;
  seasons?: number;
  episodesCount: number;
  synopsis?: string;
  sourceUrl?: string;
  episodes?: Array<{
    episodeNumber: number;
    title: string;
    link: string;
    downloadLinks: Array<{ quality: string; link: string }>;
  }>;
}

// ============================================================
//  SEARCH — Movies & TV
// ============================================================
export async function scrapeCineSubzMovies(query: string): Promise<SearchResultItem[]> {
  const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
  const results: SearchResultItem[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return results;

    const html = await res.text();
    const $ = cheerio.load(html);

    // CineSubz search results usually are inside <article class="item ...">
    $('article.item, article, .result-item, .item-movies, .item-tvshows').each((_, el) => {
      const titleEl = $(el)
        .find('.data .title a, .title a, h3 a, h2 a, .entry-title a')
        .first();
      const title = titleEl.text().trim();
      const link = titleEl.attr('href') || '';

      const image =
        $(el).find('.poster img, img').first().attr('src') ||
        $(el).find('.poster img, img').first().attr('data-src') ||
        '';

      const quality =
        $(el).find('.quality, .item-quality, .meta .quality').first().text().trim() || 'N/A';

      const rating =
        $(el).find('.rating, .vote, .meta .rating').first().text().trim() || 'N/A';

      // Detect type by URL
      let type: 'movies' | 'tvshows' = 'movies';
      if (link.includes('/tvshows/')) type = 'tvshows';
      else if (link.includes('/movies/')) type = 'movies';
      else if (title.toLowerCase().includes('tv series')) type = 'tvshows';

      if (title && link) {
        results.push({
          title,
          image,
          type,
          quality,
          rating,
          link,
        });
      }
    });

    return results;
  } catch (err) {
    console.error('[scraper] search error:', err);
    return results;
  }
}

export async function scrapeCineSubzTVSearch(query: string): Promise<SearchResultItem[]> {
  const all = await scrapeCineSubzMovies(query);
  return all.filter((r) => r.type === 'tvshows');
}

// ============================================================
//  MOVIE INFO + DOWNLOADS
// ============================================================
export async function scrapeCineSubzMovieInfo(
  targetUrlOrQuery: string
): Promise<MovieInfoResult> {
  const query = (targetUrlOrQuery || '').trim();

  // If it's a plain query, do a search first and pick the first movie result
  let movieUrl = query;
  if (!query.startsWith('http')) {
    const searchResults = await scrapeCineSubzMovies(query);
    const firstMovie =
      searchResults.find((r) => r.type === 'movies') || searchResults[0];

    if (firstMovie) {
      movieUrl = firstMovie.link;
      console.log('[scraper] resolved query →', movieUrl);
    } else {
      const fallbackUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
      return {
        title: `${query} — No results on CineSubz`,
        year: '—',
        sourceUrl: fallbackUrl,
        downloads: [
          {
            quality: 'Browsable',
            size: 'N/A',
            language: 'N/A',
            link: fallbackUrl,
          },
        ],
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(movieUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // ---------- TITLE ----------
    const title =
      $('h1.entry-title, h1[itemprop="name"], .sheader .data h1, .movie-title h1')
        .first()
        .text()
        .trim() || 'CineSubz Movie';

    // ---------- POSTER ----------
    const image =
      $('.poster img, .sheader .poster img, img[itemprop="image"], .movie-poster img')
        .first()
        .attr('src') ||
      $('.poster img, .sheader .poster img').first().attr('data-src') ||
      '';

    // ---------- RATING ----------
    let rating =
      $('.rating, [itemprop="ratingValue"], .imdb-rating span, .vote')
        .first()
        .text()
        .trim() || 'N/A';
    // Clean up like "★ 8.2" → "8.2"
    rating = rating.replace(/[★☆\s]/g, '') || 'N/A';

    // ---------- QUALITY ----------
    const quality =
      $('.quality, .item-quality, .sheader .quality').first().text().trim() || 'N/A';

    // ---------- YEAR ----------
    const yearFromTitle = title.match(/\((\d{4})\)/)?.[1];
    const year =
      $('.year, [itemprop="datePublished"], .date').first().text().trim() ||
      yearFromTitle ||
      '—';

    // ---------- DURATION ----------
    const duration =
      $('.runtime, [itemprop="duration"], .duration').first().text().trim() || 'N/A';

    // ---------- DIRECTOR ----------
    const director =
      $('.director, [itemprop="director"] a, .directors a').first().text().trim() || 'N/A';

    // ---------- IMDB ----------
    const imdb =
      $('.imdb, .imdb-rating, [data-imdb], .rating-imdb').first().text().trim() || rating;

    // ---------- LANGUAGE ----------
    const language =
      $('.language, [itemprop="inLanguage"]').first().text().trim() || 'English';

    // ---------- GENRES ----------
    const genres: string[] = [];
    $('.genres a, [itemprop="genre"] a, .sgeneros a').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    // ---------- STORY / SYNOPSIS ----------
    const story =
      $('#info .wp-content p, .wp-content p, [itemprop="description"], .story p, .synopsis p')
        .first()
        .text()
        .trim() || '';

    // ---------- CAST ----------
    const cast: Array<{ name: string; role: string; image?: string }> = [];
    $('.cast .person, .actors .person, .cast-list .cast-item, .person').each((_, el) => {
      const name = $(el).find('.name, .person-name, a').first().text().trim();
      const role = $(el).find('.role, .character, .caracter').first().text().trim();
      const img = $(el).find('img').attr('src') || '';
      if (name) cast.push({ name, role: role || 'N/A', image: img });
    });

    // ---------- GALLERY ----------
    const gallery: string[] = [];
    $('.gallery img, .backdrops img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http')) gallery.push(src);
    });

    // ---------- TRAILER ----------
    const trailer =
      $('a[href*="youtube.com"], a[href*="youtu.be"]').first().attr('href') ||
      $('iframe[src*="youtube"]').first().attr('src') ||
      '';

    // ---------- COUNTRY ----------
    const country =
      $('.country, [itemprop="countryOfOrigin"]').first().text().trim() || 'N/A';

    // ---------- DOWNLOADS ----------
    const downloads: Array<{
      quality: string;
      size: string;
      language: string;
      link: string;
    }> = [];

    // Common CineSubz structure: <ul class="download-links"><li>...</li></ul>
    // Each <a> is a download; nearby text tells quality / size / provider.
    const downloadSelectors = [
      'ul#download-links li a',
      '.download-links a',
      '.downloads a',
      '#downloads a',
      '.links-table a',
      'table.downloads a',
      'a[href*="pixeldrain"]',
      'a[href*="telegram.me"]',
      'a[href*="t.me/"]',
      'a[href*="supercloud"]',
      'a[href*="drive.google"]',
      'a[href*="mega.nz"]',
    ];

    $(downloadSelectors.join(',')).each((_, el) => {
      let link = $(el).attr('href') || '';
      const label = $(el).text().trim();

      // Skip social / nav / non-download links
      if (
        !link ||
        link.startsWith('#') ||
        link.includes('javascript:') ||
        link.includes('facebook.com') ||
        link.includes('twitter.com') ||
        link.includes('whatsapp.com') ||
        link.includes('reddit.com') ||
        link.includes('pinterest.com') ||
        link.includes('tumblr.com') ||
        link.includes('blogger.com') ||
        link.includes('vk.com')
      ) {
        return;
      }

      // Decode base64 redirect wrappers (?r=..., redirect=...)
      if (link.includes('?r=') || link.includes('redirect=')) {
        try {
          const urlParams = new URLSearchParams(link.split('?')[1]);
          const rawEncoded = urlParams.get('r') || urlParams.get('redirect');
          if (rawEncoded) {
            const decoded = Buffer.from(rawEncoded, 'base64').toString('utf-8');
            if (decoded.startsWith('http')) link = decoded;
          }
        } catch {
          /* keep default */
        }
      }

      // Context text (a + closest row/li/div)
      const contextText =
        label + ' ' + $(el).closest('tr, li, div').text().replace(/\s+/g, ' ').trim();

      // Quality
      const qualityMatch = contextText.match(
        /(480p|720p|1080p|2160p|4K|WEB-?DL|HDRip|WEBRip|BLU-?RAY|BluRay|HDTV)/i
      );
      let quality = qualityMatch ? qualityMatch[0] : label || 'Download';

      // Size
      const sizeMatch = contextText.match(/\d+(\.\d+)?\s?(GB|MB)/i);
      const size = sizeMatch ? sizeMatch[0] : 'N/A';

      // Language
      const langMatch = contextText.match(
        /(English|Sinhala|Tamil|Hindi|Telugu|Malayalam|Kannada)/i
      );
      const lang = langMatch ? langMatch[0] : 'English';

      // Provider tag
      let provider = '';
      if (link.includes('pixeldrain')) provider = ' [PixelDrain]';
      else if (link.includes('telegram.me') || link.includes('t.me/'))
        provider = ' [Telegram Bot]';
      else if (link.includes('supercloud') || link.includes('drive0'))
        provider = ' [Direct High-Speed Server]';
      else if (link.includes('drive.google.com')) provider = ' [Google Drive]';
      else if (link.includes('mega.nz')) provider = ' [MEGA]';

      downloads.push({
        quality: `${quality}${provider}`.trim(),
        size,
        language: lang,
        link,
      });
    });

    // Deduplicate by link
    const uniqueDownloads = downloads.filter(
      (item, i, self) => i === self.findIndex((x) => x.link === item.link)
    );

    return {
      title,
      image,
      quality,
      rating,
      imdb,
      director,
      language,
      genres,
      story,
      cast,
      gallery,
      trailer,
      year,
      duration,
      tag: language,
      directors: director,
      stars: cast.map((c) => c.name).slice(0, 5).join(', ') || 'N/A',
      country,
      sourceUrl: movieUrl,
      downloads: uniqueDownloads,
    };
  } catch (e) {
    console.error('[scraper] movie info error:', e);
    return {
      title: `${query} — CineSubz`,
      year: '—',
      sourceUrl: movieUrl,
      downloads: [
        {
          quality: 'Open CineSubz Page',
          size: 'N/A',
          language: 'N/A',
          link: movieUrl,
        },
      ],
    };
  }
}

// ============================================================
//  TV SERIES INFO
// ============================================================
export async function scrapeCineSubzTVInfo(
  targetUrlOrQuery: string
): Promise<TVSeriesInfoResult> {
  const query = (targetUrlOrQuery || '').trim();

  let tvUrl = query;
  if (!query.startsWith('http')) {
    const searchResults = await scrapeCineSubzTVSearch(query);
    if (searchResults.length > 0) {
      tvUrl = searchResults[0].link;
    } else {
      const fallbackUrl = `https://cinesubz.net/?s=${encodeURIComponent(query)}`;
      return {
        title: `${query} — No TV series found`,
        episodesCount: 0,
        sourceUrl: fallbackUrl,
        episodes: [
          {
            episodeNumber: 0,
            title: '🔍 Open CineSubz Search',
            link: fallbackUrl,
            downloadLinks: [{ quality: 'Browsable', link: fallbackUrl }],
          },
        ],
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(tvUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('h1.entry-title, .sheader .data h1, h1[itemprop="name"]').first().text().trim() ||
      'CineSubz TV Series';

    const image =
      $('.poster img, .sheader .poster img').first().attr('src') || '';

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

    // Episodes
    const episodes: Array<{
      episodeNumber: number;
      title: string;
      link: string;
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
          link: epLink,
          downloadLinks: [{ quality: 'Open Episode Page', link: epLink }],
        });
      }
    });

    return {
      title,
      image,
      quality: 'N/A',
      rating,
      year,
      genre,
      seasons: 1,
      episodesCount: episodes.length,
      synopsis,
      sourceUrl: tvUrl,
      episodes,
    };
  } catch (e) {
    console.error('[scraper] tv info error:', e);
    return {
      title: `${query} — CineSubz TV`,
      episodesCount: 0,
      sourceUrl: tvUrl,
      episodes: [
        {
          episodeNumber: 0,
          title: 'Open CineSubz',
          link: tvUrl,
          downloadLinks: [{ quality: 'Browsable', link: tvUrl }],
        },
      ],
    };
  }
}
