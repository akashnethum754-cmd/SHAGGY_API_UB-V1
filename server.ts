import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  scrapeCineSubzMovies,
  scrapeCineSubzMovieInfo,
  scrapeCineSubzTVSearch,
  scrapeCineSubzTVInfo,
} from './scraper'; // ඔබේ scraper file එකේ නම (e.g. scraper.ts)

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ReadyAPI CineSubz Scraper Engine Online 🚀',
  });
});

// Movie Search Endpoint: /api/movies/search?q=marco
app.get('/api/movies/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    const startTime = Date.now();
    const results = await scrapeCineSubzMovies(query);
    const latency = Date.now() - startTime;

    return res.json({
      success: true,
      status: 200,
      query,
      provider: 'cinesubz',
      totalResults: results.length,
      latencyMs: latency,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to scrape movie search',
      error: error.message,
    });
  }
});

// Movie Details & Downloads Endpoint: /api/movies/info?url=https://cinesubz.net/movies/...
app.get('/api/movies/info', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "url" is required',
      });
    }

    const data = await scrapeCineSubzMovieInfo(targetUrl);
    return res.json({
      success: true,
      status: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to scrape movie info',
      error: error.message,
    });
  }
});

// TV Series Search Endpoint: /api/tv/search?q=avatar
app.get('/api/tv/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    const results = await scrapeCineSubzTVSearch(query);
    return res.json({
      success: true,
      status: 200,
      query,
      totalResults: results.length,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to scrape TV search',
      error: error.message,
    });
  }
});

// TV Series Info Endpoint: /api/tv/info?url=https://cinesubz.net/tvshows/...
app.get('/api/tv/info', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "url" is required',
      });
    }

    const data = await scrapeCineSubzTVInfo(targetUrl);
    return res.json({
      success: true,
      status: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to scrape TV info',
      error: error.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
