import 'dotenv/config';
import express, { Request, Response } from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scrapeCineSubzMovies,
  scrapeCineSubzMovieInfo,
  scrapeCineSubzTVSearch,
  scrapeCineSubzTVInfo,
  ScraperError,
} from './src/server/cinesubzScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Global Telemetry & Metrics Store
const serverStartTime = Date.now();
let totalApiRequests = 0;
let totalLatencySum = 0;
let userCoins = 0; // coins are not enforced (free API)
const MAX_LAT = 100;
let failedRequests = 0;

const endpointStats: Record<string, { calls: number; latencies: number[] }> = {
  'cinesubz-search': { calls: 0, latencies: [] },
  'cinesubz-infodl': { calls: 0, latencies: [] },
  'cinesubz-tv-search': { calls: 0, latencies: [] },
  'cinesubz-tv-info': { calls: 0, latencies: [] },
};

// Endpoints Metadata as specified by user
const API_ENDPOINTS_CATALOG = [
  {
    id: 'cinesubz-search',
    name: 'CineSubz Movie Cinema Search',
    description: 'Fast search engine for CineSubz Sinhala subtitled & dubbed blockbuster movies with poster thumbnails and metadata.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/search',
    method: 'GET',
    coinCost: 0,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'Movie search keyword (e.g. new, Spider-Man, Deadpool)',
        default: 'new',
        in: 'query',
      },
    ],
    sampleResponse: {
      success: true,
      status: 200,
      query: 'new',
      provider: 'cinesubz',
      totalResults: 10,
      coinCost: 0,
      remainingCoins: 48,
      latencyMs: 210,
      results: [
        {
          title: 'Spider-Man: Brand New Day (2026) Sinhala Subtitles',
          link: 'https://cinesubz.net/movies/spider-man-brand-new-day-2026-sinhala-subtitles',
          image: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=600&q=80',
          type: 'movie',
        },
      ],
    },
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 0,
    successRate: 100,
    averageLatencyMs: 0,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-infodl',
    name: 'CineSubz Movie Info',
    description: 'Fetches CineSubz movie page metadata: title, year, genre, rating, synopsis and runtime.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/infodl',
    method: 'GET',
    coinCost: 0,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'Target CineSubz movie post URL',
        default: 'https://cinesubz.net/movies/spider-man-brand-new-day-2026-sinhala-subtitles',
        in: 'query',
      },
    ],
    sampleResponse: {
      success: true,
      status: 200,
      provider: 'cinesubz',
      coinCost: 0,
      remainingCoins: 45,
      latencyMs: 290,
      movie: {
        title: 'Spider-Man: Brand New Day (2026)',
        year: '2026',
        genre: 'Action, Adventure, Sci-Fi',
        downloads: [
          {
            title: 'Direct Fast Download (1080p)',
            quality: '1080p FHD',
            link: 'https://cinesubz.net/dl/spiderman-bnd-1080p-sinhala-sub.mkv',
          },
        ],
      },
    },
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 0,
    successRate: 100,
    averageLatencyMs: 0,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-tv-search',
    name: 'CineSubz TV Series Search Engine',
    description: 'Searches for all Sinhala subtitled and dubbed TV shows, anime, drama series, seasons, and episodes on CineSubz.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/tv/search',
    method: 'GET',
    coinCost: 0,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'TV show / series keyword (e.g. Avatar, Loki, Game of Thrones)',
        default: 'Avatar',
        in: 'query',
      },
    ],
    sampleResponse: {
      success: true,
      status: 200,
      query: 'Avatar',
      provider: 'cinesubz_tv',
      totalResults: 5,
      coinCost: 0,
      remainingCoins: 48,
      latencyMs: 230,
      results: [
        {
          title: 'Avatar: The Last Airbender (2024) TV Series',
          link: 'https://cinesubz.lk/tvshows/avatar-the-last-airbender-2024-tv-s01/',
          image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
          type: 'tvshows',
        },
      ],
    },
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 0,
    successRate: 100,
    averageLatencyMs: 0,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-tv-info',
    name: 'CineSubz TV Series Info',
    description: 'Fetches TV show page metadata and the episode index (titles and page URLs).',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/tv/info',
    method: 'GET',
    coinCost: 0,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'Target CineSubz TV show URL',
        default: 'https://cinesubz.lk/tvshows/avatar-the-last-airbender-2024-tv-s01/',
        in: 'query',
      },
    ],
    sampleResponse: {
      success: true,
      status: 200,
      provider: 'cinesubz_tv',
      coinCost: 0,
      remainingCoins: 45,
      latencyMs: 310,
      series: {
        title: 'Avatar: The Last Airbender (2024)',
        year: '2024',
        genre: 'Action, Adventure, Fantasy',
        episodesCount: 8,
      },
    },
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 0,
    successRate: 100,
    averageLatencyMs: 0,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
];

// Helper: Format uptime into human readable string
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}


// ---- Security: API key auth + rate limit ----
const API_KEYS = new Set((process.env.API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean));
const hits = new Map<string, { n: number; reset: number }>();
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 60);

function guard(req: Request, res: Response, next: () => void) {
  if (API_KEYS.size > 0) {
    const key = (req.header('x-api-key') || (req.query.apikey as string) || '').toString();
    if (!API_KEYS.has(key)) {
      return res.status(401).json({ success: false, status: 401, error: 'Invalid or missing API key' });
    }
  }
  const id = req.ip || 'anon';
  const now = Date.now();
  const h = hits.get(id);
  if (!h || now > h.reset) hits.set(id, { n: 1, reset: now + 60_000 });
  else if (++h.n > RATE_LIMIT) {
    return res.status(429).json({ success: false, status: 429, error: 'Rate limit exceeded' });
  }
  if (hits.size > 5000) hits.clear();
  next();
}

function getQ(req: Request, fallback?: string): string {
  const raw = req.query.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim() ?? '';
  if (!q && fallback === undefined) throw new ScraperError('Query parameter "q" is required', 400);
  return (q || fallback || '').slice(0, 300);
}

function record(id: string, latencyMs: number) {
  totalApiRequests++;
  totalLatencySum += latencyMs;
  const st = (endpointStats[id] ||= { calls: 0, latencies: [] });
  st.calls++;
  st.latencies.push(latencyMs);
  if (st.latencies.length > MAX_LAT) st.latencies.shift();
}

function fail(res: Response, error: any, start: number) {
  failedRequests++;
  const status = error instanceof ScraperError ? error.status : 500;
  res.status(status).json({
    success: false,
    status,
    error: error?.message || 'Internal error',
    latencyMs: Date.now() - start,
  });
}

// 1. System stats route: live RAM, CPU, Date/Time, Requests, Health
app.get('/api/system/stats', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const processUptimeSec = Math.floor(process.uptime());
  const osUptimeSec = Math.floor(os.uptime());
  const now = new Date();

  // Sri Lanka time (Asia/Colombo UTC+5:30)
  const colomboTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now);

  const utcTime = now.toUTCString();
  const isoTime = now.toISOString();

  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  const avgLatency = Math.round(totalLatencySum / Math.max(1, totalApiRequests));

  res.json({
    success: true,
    server: {
      name: 'readyAPI CineSubz Engine Server',
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      cpuModel: cpus[0]?.model || 'Cloud vCPU',
      cpuCores: cpus.length,
      loadAverage: loadAvg,
    },
    dateTime: {
      timestamp: now.getTime(),
      iso: isoTime,
      utc: utcTime,
      sriLankaFormatted: colomboTime,
      timezone: 'Asia/Colombo (UTC+05:30)',
    },
    ramUsage: {
      processRssMb: +(mem.rss / (1024 * 1024)).toFixed(2),
      processHeapTotalMb: +(mem.heapTotal / (1024 * 1024)).toFixed(2),
      processHeapUsedMb: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
      processExternalMb: +(mem.external / (1024 * 1024)).toFixed(2),
      systemTotalMb: +(totalMem / (1024 * 1024)).toFixed(2),
      systemFreeMb: +(freeMem / (1024 * 1024)).toFixed(2),
      systemUsedMb: +(usedMem / (1024 * 1024)).toFixed(2),
      systemUsagePercent: +((usedMem / totalMem) * 100).toFixed(1),
      heapUsagePercent: +((mem.heapUsed / mem.heapTotal) * 100).toFixed(1),
    },
    uptime: {
      processUptimeSeconds: processUptimeSec,
      processUptimeHuman: formatUptime(processUptimeSec),
      systemUptimeSeconds: osUptimeSec,
      systemUptimeHuman: formatUptime(osUptimeSec),
      startedAt: new Date(serverStartTime).toISOString(),
    },
    metrics: {
      totalRequests: totalApiRequests,
      averageLatencyMs: avgLatency,
      successRate:
        totalApiRequests + failedRequests > 0
          ? Math.round((1000 * totalApiRequests) / (totalApiRequests + failedRequests)) / 10
          : 100,
      userCoinsRemaining: userCoins,
      endpointBreakdown: endpointStats,
      activeEndpoints: API_ENDPOINTS_CATALOG.length,
      healthStatus: 'HEALTHY_OPTIMAL',
    },
  });
});

// 2. Endpoints Catalog
app.get('/api/v1/endpoints', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: API_ENDPOINTS_CATALOG.length,
    endpoints: API_ENDPOINTS_CATALOG.map((ep) => ({
      ...ep,
      remainingCoins: userCoins,
      totalCalls: (endpointStats[ep.id]?.calls || ep.totalCalls),
    })),
  });
});

// 3. CineSubz Movie Search  GET /api/v1/movies/cinesubz/search?q=new
app.get('/api/v1/movies/cinesubz/search', guard, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const q = getQ(req);
    const results = await scrapeCineSubzMovies(q);
    const latencyMs = Date.now() - start;
    record('cinesubz-search', latencyMs);
    res.json({ success: true, status: 200, query: q, provider: 'cinesubz', totalResults: results.length, latencyMs, results });
  } catch (e) {
    fail(res, e, start);
  }
});

// 4. CineSubz Movie Info  GET /api/v1/movies/cinesubz/infodl?q=https://...
app.get('/api/v1/movies/cinesubz/infodl', guard, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const movie = await scrapeCineSubzMovieInfo(getQ(req));
    const latencyMs = Date.now() - start;
    record('cinesubz-infodl', latencyMs);
    res.json({ success: true, status: 200, provider: 'cinesubz', latencyMs, movie });
  } catch (e) {
    fail(res, e, start);
  }
});

// 5. CineSubz TV Search  GET /api/v1/movies/cinesubz/tv/search?q=Avatar
app.get('/api/v1/movies/cinesubz/tv/search', guard, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const q = getQ(req);
    const results = await scrapeCineSubzTVSearch(q);
    const latencyMs = Date.now() - start;
    record('cinesubz-tv-search', latencyMs);
    res.json({ success: true, status: 200, query: q, provider: 'cinesubz_tv', totalResults: results.length, latencyMs, results });
  } catch (e) {
    fail(res, e, start);
  }
});

// 6. CineSubz TV Info  GET /api/v1/movies/cinesubz/tv/info?q=https://...
app.get('/api/v1/movies/cinesubz/tv/info', guard, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const series = await scrapeCineSubzTVInfo(getQ(req));
    const latencyMs = Date.now() - start;
    record('cinesubz-tv-info', latencyMs);
    res.json({ success: true, status: 200, provider: 'cinesubz_tv', latencyMs, series });
  } catch (e) {
    fail(res, e, start);
  }
});

// Frontend Vite Middleware / Production static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 readyAPI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
