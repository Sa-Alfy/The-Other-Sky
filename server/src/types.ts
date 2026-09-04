export type WishStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type WishVisibility = 'public' | 'private';

export type Wish = {
  id: string;
  text: string;
  category: string;
  status: WishStatus;
  visibility: WishVisibility;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string | null;
  fulfillmentNote?: string | null;
  reactions: number;
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  hue: number;
};

export type LightPayload = {
  wishId: string;
};

export type CreateWishInput = {
  text: string;
  category?: string;
  visibility?: WishVisibility;
};

export type FulfillWishInput = {
  note?: string;
};

export type PersonalSkyData = {
  ownWishes: Wish[];
  savedWishes: Wish[];
  lightedWishes: Wish[];
};

export type Constellation = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  wishCount: number;
};

export type MirrorResult = {
  relatedWishes: Wish[];
  message: string;
};

// Database types
export type DbUser = {
  id: string;
  anonymous_id: string;
  created_at: string;
  last_seen_at: string;
};

export type DbWish = {
  id: string;
  user_id: string;
  text: string;
  category: string;
  status: WishStatus;
  visibility: WishVisibility;
  created_at: string;
  updated_at: string;
  fulfilled_at: string | null;
  fulfillment_note?: string | null;
};

export type DbStar = {
  id: string;
  wish_id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  hue: number;
  created_at: string;
};

export type DbLight = {
  id: string;
  wish_id: string;
  user_id: string;
  created_at: string;
};
