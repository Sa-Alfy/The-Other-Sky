import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { WORDLIST } from './wordlist';

const BCRYPT_COST = 12;

export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase();
}

export function isValidPhraseFormat(phrase: string): boolean {
  const normalized = normalizePhrase(phrase);
  const parts = normalized.split('-');
  return parts.length === 4 && parts.every((word) => word.length > 0 && /^[a-z]+$/.test(word));
}

export function generateRecoveryPhrase(): string {
  const selected: string[] = [];
  for (let i = 0; i < 4; i++) {
    const index = crypto.randomInt(0, WORDLIST.length);
    selected.push(WORDLIST[index]);
  }
  return selected.join('-');
}

export async function hashRecoveryPhrase(phrase: string): Promise<string> {
  const normalized = normalizePhrase(phrase);
  return bcrypt.hash(normalized, BCRYPT_COST);
}

export async function verifyRecoveryPhrase(phrase: string, hash: string): Promise<boolean> {
  const normalized = normalizePhrase(phrase);
  return bcrypt.compare(normalized, hash);
}
