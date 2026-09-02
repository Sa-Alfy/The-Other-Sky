import { Wish } from './types';

const now = new Date();

export const mockWishes: Wish[] = Array.from({ length: 72 }, (_, index) => {
  const createdAt = new Date(now.getTime() - (index + 1) * 1000 * 60 * 24 * 2.7).toISOString();

  return {
    id: `wish-${index + 1}`,
    text: [
      'I hope future me is peaceful.',
      'I wish I could stop comparing myself to everyone else.',
      'Maybe I am allowed to begin again.',
      'I want to be brave enough to tell the truth.',
      'I hope someone remembers how hard I tried.',
      'I wish I trusted my own timing.',
      'I want a quieter kind of happiness.',
      'I hope my life slows down enough to feel real.',
      'I am learning to be gentle with my own becoming.',
      'I hope the next chapter is kinder.',
      'I wish I could stop carrying this fear so heavily.',
      'I want to feel seen without performing for it.',
      'I hope the people I love know how much I try.',
      'I want to believe my life is not late.',
      'I wish I could forgive myself in public and private.',
      'I hope the lonely parts of me find company.',
      'I want to trust the path even when I cannot see the end.',
      'I wish I were less afraid of being honest.',
      'I hope my courage arrives before my certainty does.',
      'I want to leave this season behind with more grace than fear.'
    ][index % 20],
    category: ['hope', 'love', 'clarity', 'healing', 'growth', 'peace'][index % 6],
    status: 'approved',
    visibility: 'public',
    createdAt,
    updatedAt: createdAt,
    reactions: 18 + (index % 23),
    x: (index % 9) / 8 + (index % 3) * 0.11,
    y: (index % 11) / 10 + (index % 5) * 0.08,
    z: 0,
    size: 1.2 + ((index * 7) % 8) / 7,
    brightness: 0.7 + ((index * 13) % 10) / 10,
    hue: 35 + (index * 9) % 80,
  };
});
