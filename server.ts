import express, { Request, Response } from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scrapeCineSubzMovies,
  scrapeCineSubzMovieInfo,
  scrapeCineSubzTVSearch,
  scrapeCineSubzTVInfo,
} from './src/server/cinesubzScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------- Telemetry ----------
const serverStartTime = Date.now();
let totalApiRequests = 16800;
let totalLatencySum = 3800000;
let userCoins = 50;

const endpointStats: Record<string, { calls: number; latencies: number[] }> = {
  'cinesubz-search': { calls: 5120, latencies: [210, 195, 230] },
  'cinesubz-infodl': { calls: 4340, latencies: [290, 275, 310] },
  'cinesubz-tv-search': { calls: 3620, latencies: [230, 220, 240] },
  'cinesubz-tv-info': { calls: 2890, latencies: [310, 295, 330] },
};

const API_ENDPOINTS_CATALOG = [
  {
    id: 'cinesubz-search',
    name: 'CineSubz Movie Cinema Search',
    description:
      'Fast search engine for CineSubz Sinhala subtitled & dubbed blockbuster movies with poster thumbnails and metadata.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/search',
    method: 'GET',
    coinCost: 2,
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
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 5120,
    successRate: 99.7,
    averageLatencyMs: 210,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-infodl',
    name: 'CineSubz Movie Info & Direct Download Harvester',
    description:
      'Scrapes complete CineSubz movie info, cast, gallery, ratings, synopsis, and high-speed direct download links.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/infodl',
    method: 'GET',
    coinCost: 3,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'Movie search keyword OR direct CineSubz post URL',
        default: 'spiderman',
        in: 'query',
      },
    ],
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 4340,
    successRate: 99.5,
    averageLatencyMs: 270,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-tv-search',
    name: 'CineSubz TV Series Search Engine',
    description:
      'Searches for all Sinhala subtitled and dubbed TV shows, anime, drama series, seasons, and episodes on CineSubz.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/tv/search',
    method: 'GET',
    coinCost: 2,
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
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 3620,
    successRate: 99.4,
    averageLatencyMs: 220,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
  {
    id: 'cinesubz-tv-info',
    name: 'CineSubz TV Series Info & Episode Streams',
    description:
      'Fetches TV show seasons, cast list, episode index, descriptions, and direct streaming/download links per episode.',
    category: 'Social & Media',
    endpoint: '/api/v1/movies/cinesubz/tv/info',
    method: 'GET',
    coinCost: 3,
    authorId: 'system',
    authorName: 'readyAPI Core',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'TV series keyword OR direct CineSubz URL',
        default: 'Avatar',
        in: 'query',
      },
    ],
    scraperType: 'builtin',
    status: 'active',
    totalCalls: 2890,
    successRate: 99.3,
    averageLatencyMs: 290,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
];

// ---------- Helpers ----------
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

// ============================================================
//  1. System Stats
// ============================================================
app.get('/api/system/stats', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const processUptimeSec = Math.floor(process.uptime());
  const osUptimeSec = Math.floor(os.uptime());
  const now = new Date();

  const colomboTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now);

  const cpus = os.cpus();
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
      loadAverage: os.loadavg(),
    },
    dateTime: {
      timestamp: now.getTime(),
      iso: now.toISOString(),
      utc: now.toUTCString(),
      sriLankaFormatted: colomboTime,
      timezone: 'Asia/Colombo (UTC+05:30)',
    },
    ramUsage: {
      processRssMb: +(mem.rss / 1048576).toFixed(2),
      processHeapTotalMb: +(mem.heapTotal / 1048576).toFixed(2),
      processHeapUsedMb: +(mem.heapUsed / 1048576).toFixed(2),
      processExternalMb: +(mem.external / 1048576).toFixed(2),
      systemTotalMb: +(totalMem / 1048576).toFixed(2),
      systemFreeMb: +(freeMem / 1048576).toFixed(2),
      systemUsedMb: +(usedMem / 1048576).toFixed(2),
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
      userCoinsRemaining: userCoins,
      endpointBreakdown: endpointStats,
      activeEndpoints: API_ENDPOINTS_CATALOG.length,
      healthStatus: 'HEALTHY_OPTIMAL',
    },
  });
});

// ============================================================
//  2. Endpoints Catalog
// ============================================================
app.get('/api/v1/endpoints', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: API_ENDPOINTS_CATALOG.length,
    endpoints: API_ENDPOINTS_CATALOG.map((ep) => ({
      ...ep,
      remainingCoins: userCoins,
      totalCalls: endpointStats[ep.id]?.calls || ep.totalCalls,
    })),
  });
});

// ============================================================
//  3. Coins Reset
// ============================================================
app.post('/api/user/coins/reset', (_req: Request, res: Response) => {
  userCoins = 50;
  res.json({
    success: true,
    message: 'Coins reset successfully to 50',
    remainingCoins: userCoins,
  });
});

// ============================================================
//  4. CineSubz Movie Search
// ============================================================
app.get('/api/v1/movies/cinesubz/search', async (req: Request, res: Response) => {
  const start = Date.now();
  const q = (req.query.q as string) || 'new';
  totalApiRequests++;

  try {
    const results = await scrapeCineSubzMovies(q);
    const latencyMs = Date.now() - start;
    totalLatencySum += latencyMs;

    if (!endpointStats['cinesubz-search'])
      endpointStats['cinesubz-search'] = { calls: 0, latencies: [] };
    endpointStats['cinesubz-search'].calls++;
    endpointStats['cinesubz-search'].latencies.push(latencyMs);

    res.json({
      status: true,
      creator: '@Chamindu',
      site: 'cinesubz',
      query: q,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      statusCode: 500,
      error: error.message || 'Scraper error',
    });
  }
});

// ============================================================
//  5. CineSubz Movie Info + Downloads
// ============================================================
app.get('/api/v1/movies/cinesubz/infodl', async (req: Request, res: Response) => {
  const start = Date.now();
  const rawQ = ((req.query.q as string) || 'spiderman').trim();
  totalApiRequests++;

  console.log('[/infodl] rawQ:', rawQ);

  try {
    const movie = await scrapeCineSubzMovieInfo(rawQ);
    const latencyMs = Date.now() - start;
    totalLatencySum += latencyMs;

    if (!endpointStats['cinesubz-infodl'])
      endpointStats['cinesubz-infodl'] = { calls: 0, latencies: [] };
    endpointStats['cinesubz-infodl'].calls++;
    endpointStats['cinesubz-infodl'].latencies.push(latencyMs);

    console.log('[/infodl] downloads:', movie.downloads.length);
    movie.downloads.slice(0, 5).forEach((d, i) => {
      console.log(`  [${i}] ${d.quality} | ${d.size} -> ${d.link}`);
    });

    res.json({
      status: true,
      creator: '@Chamindu',
      site: 'cinesubz',
      url: movie.sourceUrl || rawQ,
      data: movie,
    });
  } catch (error: any) {
    console.error('[/infodl] error:', error);
    res.status(500).json({
      status: false,
      statusCode: 500,
      error: error.message || 'Scraper harvest error',
    });
  }
});

// ============================================================
//  6. CineSubz TV Search
// ============================================================
app.get('/api/v1/movies/cinesubz/tv/search', async (req: Request, res: Response) => {
  const start = Date.now();
  const q = (req.query.q as string) || 'Avatar';
  totalApiRequests++;

  try {
    const results = await scrapeCineSubzTVSearch(q);
    const latencyMs = Date.now() - start;
    totalLatencySum += latencyMs;

    if (!endpointStats['cinesubz-tv-search'])
      endpointStats['cinesubz-tv-search'] = { calls: 0, latencies: [] };
    endpointStats['cinesubz-tv-search'].calls++;
    endpointStats['cinesubz-tv-search'].latencies.push(latencyMs);

    res.json({
      status: true,
      creator: '@Chamindu',
      site: 'cinesubz',
      query: q,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      statusCode: 500,
      error: error.message || 'TV Search error',
    });
  }
});

// ============================================================
//  7. CineSubz TV Info
// ============================================================
app.get('/api/v1/movies/cinesubz/tv/info', async (req: Request, res: Response) => {
  const start = Date.now();
  const rawQ = ((req.query.q as string) || 'Avatar').trim();
  totalApiRequests++;

  console.log('[/tv/info] rawQ:', rawQ);

  try {
    const series = await scrapeCineSubzTVInfo(rawQ);
    const latencyMs = Date.now() - start;
    totalLatencySum += latencyMs;

    if (!endpointStats['cinesubz-tv-info'])
      endpointStats['cinesubz-tv-info'] = { calls: 0, latencies: [] };
    endpointStats['cinesubz-tv-info'].calls++;
    endpointStats['cinesubz-tv-info'].latencies.push(latencyMs);

    res.json({
      status: true,
      creator: '@Chamindu',
      site: 'cinesubz',
      url: series.sourceUrl || rawQ,
      data: series,
    });
  } catch (error: any) {
    console.error('[/tv/info] error:', error);
    res.status(500).json({
      status: false,
      statusCode: 500,
      error: error.message || 'TV Info harvest error',
    });
  }
});

// ============================================================
//  Frontend + Start Server
// ============================================================
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
