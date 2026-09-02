import { mockWishes } from './mockData';
import { CreateWishInput, Wish } from './types';

let wishes: Wish[] = [...mockWishes];

export function listWishes(): Wish[] {
  return [...wishes];
}

export function getWishById(id: string): Wish | undefined {
  return wishes.find((wish) => wish.id === id);
}

export function createWish(input: CreateWishInput): Wish {
  const createdAt = new Date().toISOString();
  const wish: Wish = {
    id: `wish-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text: input.text.trim(),
    category: input.category ?? 'general',
    status: 'pending',
    visibility: input.visibility ?? 'public',
    createdAt,
    updatedAt: createdAt,
    reactions: 0,
    x: Number((Math.random() * 0.9 + 0.07).toFixed(3)),
    y: Number((Math.random() * 0.9 + 0.04).toFixed(3)),
    z: 0,
    size: Number((Math.random() * 1.6 + 1.2).toFixed(2)),
    brightness: Number((Math.random() * 0.5 + 0.8).toFixed(2)),
    hue: Math.floor(Math.random() * 80) + 30,
  };

  wishes = [wish, ...wishes];
  return wish;
}

export function addLight(wishId: string): Wish | undefined {
  const target = wishes.find((wish) => wish.id === wishId);

  if (!target) {
    return undefined;
  }

  target.reactions += 1;
  target.updatedAt = new Date().toISOString();
  return target;
}
