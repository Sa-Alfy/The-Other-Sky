import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { addLight, createWish, getWishById, listWishes } from './storageDb';
import { generateAnonymousId, safeErrorMessage } from './utils';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

// Validation schemas
const createWishSchema = z.object({
  text: z.string().trim().min(3, 'Wish must be at least 3 characters').max(280, 'Wish must be 280 characters or less'),
  category: z.string().trim().max(50).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

const lightSchema = z.object({
  wishId: z.string().min(1, 'Wish ID required'),
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Session middleware: get or create anonymous ID
app.use((req: Request, res: Response, next) => {
  // Try to get anonymous ID from cookie or query param
  let anonymousId = req.query.anonymous_id as string | undefined;

  if (!anonymousId) {
    // Generate new anonymous ID
    anonymousId = generateAnonymousId();
  }

  // Attach to request for use in route handlers
  (req as any).anonymousId = anonymousId;

  // Set in response header so client can persist it
  res.setHeader('X-Anonymous-ID', anonymousId);

  next();
});

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.get('/api/wishes', async (_req: Request, res: Response) => {
  try {
    const wishes = await listWishes();
    res.json({ success: true, data: wishes });
  } catch (error) {
    console.error('Error listing wishes:', error);
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error),
    });
  }
});

app.get('/api/wishes/:id', async (req: Request, res: Response) => {
  try {
    const wish = await getWishById(req.params.id as string);

    if (!wish) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wish not found.' },
      });
    }

    return res.json({ success: true, data: wish });
  } catch (error) {
    console.error('Error getting wish:', error);
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error),
    });
  }
});

app.post('/api/wishes', async (req: Request, res: Response) => {
  try {
    const parsed = createWishSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues?.[0]?.message ?? 'Wish must be between 3 and 280 characters.',
        },
      });
    }

    const anonymousId = (req as any).anonymousId as string;
    const result = await createWish(parsed.data, anonymousId);

    // Check if there was a rate limit error
    if ('error' in result && 'code' in result) {
      return res.status(429).json({
        success: false,
        error: result,
      });
    }

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating wish:', error);
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error),
    });
  }
});

app.post('/api/wishes/:id/light', async (req: Request, res: Response) => {
  try {
    const parsed = lightSchema.safeParse({ wishId: req.params.id, ...req.body });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Light request was invalid.' },
      });
    }

    const anonymousId = (req as any).anonymousId as string;
    const result = await addLight(parsed.data.wishId, anonymousId);

    // Check for rate limit error
    if (result && 'error' in result && 'code' in result) {
      return res.status(429).json({
        success: false,
        error: result,
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wish not found.' },
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending light:', error);
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error),
    });
  }
});

// Error handling for unhandled routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to PostgreSQL' : 'WARNING: DATABASE_URL not set'}`);
});

