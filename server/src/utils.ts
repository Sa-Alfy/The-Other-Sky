import { randomBytes } from 'crypto';

/**
 * Generate a secure anonymous identifier
 * Format: random-{hex-string}
 * Not cryptographically tied to any personal data
 */
export function generateAnonymousId(): string {
  const randomPart = randomBytes(8).toString('hex');
  return `${Date.now()}-${randomPart}`;
}

/**
 * Safe error response to prevent leaking internal details
 */
export function safeErrorMessage(error: unknown): { message: string; code: string } {
  if (error instanceof Error) {
    // Log the full error internally
    console.error('Internal error:', error);

    // Return safe message to client
    if (error.message.includes('RATE_LIMITED')) {
      return { message: 'Please wait before trying again.', code: 'RATE_LIMITED' };
    }

    if (error.message.includes('NOT_FOUND')) {
      return { message: 'Wish not found.', code: 'NOT_FOUND' };
    }
  }

  return { message: 'An error occurred. Please try again.', code: 'INTERNAL_ERROR' };
}
