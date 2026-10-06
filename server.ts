import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  scrapeCineSubzMovies,
  scrapeCineSubzMovieInfo,
  scrapeCineSubzTVSearch,
  scrapeCineSubzTVInfo,
} from './src/server/cinesubzScraper';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CineSubz Search Endpoint
app.get('/api/cinesubz/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q || req.query.query) as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    const startTime = Date.now();
    const results = await scrapeCineSubzMovies(query);
    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      status: 200,
      query,
      provider: 'cinesubz',
      totalResults: results.length,
      latencyMs,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to search CineSubz',
      error: error.message,
    });
  }
});

// CineSubz Movie Details / Download Links Endpoint
app.get('/api/cinesubz/info', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "url" is required',
      });
    }

    const data = await scrapeCineSubzMovieInfo(url);
    return res.json({
      success: true,
      status: 200,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch movie info',
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Shaggy API Server running on port ${PORT}`);
});
