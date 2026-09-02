import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { addLight, createWish, getModerationQueue, getWishById, listWishes, moderateWish, reportWish } from './storageDb';
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

const reportSchema = z.object({ reason: z.string().trim().max(500).optional() });
const moderationSchema = z.object({ action: z.enum(['approve', 'reject']) });
const sessionCookieName = 'othersky_sid';
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
const ipBackstop = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Please wait before trying again.' } },
});

function parseCookie(header: string | undefined, name: string): string | undefined {
  return header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || req.header('authorization') !== `Bearer ${expected}`) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authorization required.' } });
    return;
  }
  next();
}

// Middleware
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Session middleware: get or create anonymous ID
app.use((req: Request, res: Response, next) => {
  let anonymousId = parseCookie(req.header('cookie'), sessionCookieName);

  if (!anonymousId) {
    anonymousId = generateAnonymousId();
    res.cookie(sessionCookieName, anonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: '/',
    });
  }

  (req as any).anonymousId = anonymousId;
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

app.post('/api/wishes', ipBackstop, async (req: Request, res: Response) => {
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

app.post('/api/wishes/:id/light', ipBackstop, async (req: Request, res: Response) => {
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

app.post('/api/wishes/:id/report', async (req: Request, res: Response) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Report reason was invalid.' } });
  try {
    const result = await reportWish(req.params.id as string, (req as any).anonymousId as string, parsed.data.reason);
    if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Wish not found.' } });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error reporting wish:', error);
    return res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
});

app.get('/api/admin/queue', requireAdmin, async (_req: Request, res: Response) => {
  try { return res.json({ success: true, data: await getModerationQueue() }); }
  catch (error) { console.error('Error loading moderation queue:', error); return res.status(500).json({ success: false, error: safeErrorMessage(error) }); }
});

app.post('/api/admin/wishes/:id/moderate', requireAdmin, async (req: Request, res: Response) => {
  const parsed = moderationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Moderation action was invalid.' } });
  try {
    const wish = await moderateWish(req.params.id as string, parsed.data.action);
    if (!wish) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Wish not found.' } });
    return res.json({ success: true, data: wish });
  } catch (error) {
    console.error('Error moderating wish:', error);
    return res.status(500).json({ success: false, error: safeErrorMessage(error) });
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

