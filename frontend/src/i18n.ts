import { createContext, useCallback, useContext } from 'react'

export type Language = 'en' | 'bn'

/** The six constellations, in the order they are stepped through in the sky.
 *  Shared so the composer, the index and the in-sky switcher cannot drift. */
export const WISH_CATEGORIES = ['hope', 'love', 'peace', 'healing', 'growth', 'clarity'] as const

const STORAGE_KEY = 'othersky_lang'

/**
 * Bangla copy here is written for *meaning*, not word-for-word. The English
 * original is deliberately spare and poetic, so a literal rendering would read
 * as stilted translationese. Two deliberate choices:
 *
 *  - Register: the intimate second person (তুমি) throughout, because this is a
 *    private space someone talks to themselves in. The formal আপনি would make
 *    the app feel like a government form.
 *  - Numbers: rendered in Bengali numerals, so a Bangla reader sees ৭ জন rather
 *    than a half-translated "7 জন".
 */
export const strings = {
  // Landing
  'landing.eyebrow': {
    en: 'There are things we want.',
    bn: 'কিছু চাওয়া মনের ভেতরেই থেকে যায়।',
  },
  'landing.title': { en: 'THE OTHER SKY', bn: 'অন্য আকাশ' },
  'landing.tagline1': {
    en: 'Things we are afraid to say.',
    bn: 'যে কথা বলতে ভয় হয়।',
  },
  'landing.tagline2': {
    en: 'Things we still believe might happen.',
    bn: 'যা এখনও হতে পারে বলে বিশ্বাস হয়।',
  },
  'landing.enter': { en: 'Enter the Sky', bn: 'আকাশে প্রবেশ করো' },

  // Shell / navigation
  'nav.brand': { en: 'THE OTHER SKY', bn: 'অন্য আকাশ' },
  'nav.constellations': { en: 'Constellations', bn: 'তারামণ্ডল' },
  'nav.morningSky': { en: 'Morning Sky', bn: 'ভোরের আকাশ' },
  'nav.personalSky': { en: 'Personal Sky', bn: 'নিজের আকাশ' },
  'nav.leaveWish': { en: 'Leave a Wish', bn: 'একটি ইচ্ছে রেখে যাও' },
  'nav.language': { en: 'বাংলা', bn: 'English' },
  'nav.languageLabel': { en: 'Switch to Bangla', bn: 'ইংরেজিতে বদলাও' },

  // Sky
  'sky.loading': { en: 'Loading the sky...', bn: 'আকাশ আসছে…' },
  'sky.search': { en: 'Find a wish…', bn: 'ইচ্ছে খোঁজো…' },
  'sky.searchLabel': {
    en: 'Find a wish by keyword',
    bn: 'শব্দ দিয়ে ইচ্ছে খোঁজো',
  },
  'sky.canvasLabel': {
    en: 'Galaxy of wishes canvas — drag to pan, scroll to zoom, arrow keys to move',
    bn: 'ইচ্ছের আকাশ — সরাতে টানো, ছোট-বড় করতে স্ক্রল করো, তির চিহ্ন দিয়ে ঘুরে দেখো',
  },
  'sky.wishesLabel': { en: 'Wishes in the sky', bn: 'আকাশের ইচ্ছেগুলো' },
  'sky.openWish': { en: 'Open wish', bn: 'ইচ্ছেটি খোলো' },
  'sky.zoomIn': { en: 'Zoom in', bn: 'কাছে আনো' },
  'sky.zoomOut': { en: 'Zoom out', bn: 'দূরে সরাও' },
  'sky.recenter': { en: 'Recenter', bn: 'মাঝে ফেরাও' },
  'sky.recenterLabel': { en: 'Recenter the sky', bn: 'আকাশ মাঝে ফিরিয়ে আনো' },
  'sky.constellationBanner': { en: 'Constellation', bn: 'তারামণ্ডল' },
  'sky.prevConstellation': { en: 'Previous constellation', bn: 'আগের তারামণ্ডল' },
  'sky.nextConstellation': { en: 'Next constellation', bn: 'পরের তারামণ্ডল' },
  'sky.readAsList': { en: 'Read as a list', bn: 'তালিকা হিসেবে পড়ো' },
  'sky.showEntireSky': { en: 'Show entire sky ×', bn: 'পুরো আকাশ দেখাও ×' },
  'sky.showAllStars': { en: 'Show all stars', bn: 'সব তারা দেখাও' },

  // Wish card
  'wish.empty': {
    en: 'Select a star in the sky.',
    bn: 'আকাশের একটি তারা বেছে নাও।',
  },
  'wish.none': { en: 'No wish selected yet.', bn: 'এখনও কোনো ইচ্ছে বেছে নেওয়া হয়নি।' },
  'wish.someone': { en: 'Someone', bn: 'কেউ একজন' },
  'wish.fulfilled': { en: '✦ Fulfilled', bn: '✦ সত্যি হয়েছে' },
  'wish.sendLight': { en: '✦ Send Light', bn: '✦ আলো পাঠাও' },
  'wish.save': { en: 'Save', bn: 'সংগ্রহে রাখো' },
  'wish.saved': { en: 'Saved ✓', bn: 'সংগ্রহে আছে ✓' },
  'wish.mirror': { en: '✦ Mirror', bn: '✦ প্রতিবিম্ব' },
  'wish.close': { en: 'Back to the sky', bn: 'আকাশে ফিরে যাও' },
  'wish.lightCount': {
    en: '{n} people have sent light.',
    bn: '{n} জন আলো পাঠিয়েছে।',
  },

  // Composer
  'composer.prompt': { en: 'What do you wish for?', bn: 'তুমি কী চাও?' },
  'composer.label': { en: 'Write your wish', bn: 'তোমার ইচ্ছেটা লেখো' },
  'composer.placeholder': {
    en: 'I hope future me is kinder to myself.',
    bn: 'আশা করি ভবিষ্যতের আমি নিজের প্রতি আরেকটু নরম হবে।',
  },
  'composer.release': { en: 'Release it', bn: 'আকাশে ছেড়ে দাও' },
  'composer.close': { en: 'Close wish composer', bn: 'লেখার জায়গা বন্ধ করো' },

  // Release sequence
  'release.done': {
    en: 'Your wish is somewhere in this sky now.',
    bn: 'তোমার ইচ্ছে এখন এই আকাশের কোথাও আছে।',
  },
  'release.keepLink': {
    en: 'Keep this link to find it again.',
    bn: 'আবার খুঁজে পেতে এই লিংকটা রেখে দাও।',
  },
  'release.linkLabel': {
    en: 'Link to find your wish again',
    bn: 'ইচ্ছেটি আবার খুঁজে পাওয়ার লিংক',
  },
  'release.copy': { en: 'Copy', bn: 'কপি করো' },
  'release.copied': { en: 'Copied ✓', bn: 'কপি হয়েছে ✓' },
  'release.continue': { en: 'Continue', bn: 'এগিয়ে যাও' },

  // Categories
  'category.hope': { en: 'Hope', bn: 'আশা' },
  'category.love': { en: 'Love', bn: 'ভালোবাসা' },
  'category.peace': { en: 'Peace', bn: 'শান্তি' },
  'category.healing': { en: 'Healing', bn: 'আরোগ্য' },
  'category.growth': { en: 'Growth', bn: 'বিকাশ' },
  'category.clarity': { en: 'Clarity', bn: 'স্পষ্টতা' },

  // Mirror
  'mirror.badge': { en: '✦ The Mirror', bn: '✦ প্রতিবিম্ব' },
  'mirror.message': { en: "You're not the only one.", bn: 'তুমি একা নও।' },
  'mirror.loading': {
    en: 'Listening for echoes in the sky...',
    bn: 'আকাশে প্রতিধ্বনি শোনা হচ্ছে…',
  },
  'mirror.empty': {
    en: 'No similar wishes found yet in this part of the sky.',
    bn: 'আকাশের এই অংশে এখনও মিলে যাওয়া কোনো ইচ্ছে পাওয়া যায়নি।',
  },
  'mirror.close': { en: 'Close mirror', bn: 'প্রতিবিম্ব বন্ধ করো' },
  'mirror.regionLabel': {
    en: 'Mirror — related wishes',
    bn: 'প্রতিবিম্ব — মিলে যাওয়া ইচ্ছেগুলো',
  },
  'mirror.light': { en: '{n} light', bn: '{n} আলো' },

  // Morning Sky
  'morning.back': { en: '← Return to Sky', bn: '← আকাশে ফিরে যাও' },
  'morning.eyebrow': { en: 'The Morning Sky', bn: 'ভোরের আকাশ' },
  'morning.title': { en: 'It happened.', bn: 'সত্যি হয়েছে।' },
  'morning.subtitle': {
    en: 'Wishes that found their answer in the waking world.',
    bn: 'যে ইচ্ছেগুলো জেগে ওঠা পৃথিবীতে উত্তর খুঁজে পেয়েছে।',
  },
  'morning.loading': { en: 'Waiting for dawn...', bn: 'ভোরের অপেক্ষায়…' },
  'morning.emptyTitle': {
    en: 'The morning sky is still quiet.',
    bn: 'ভোরের আকাশ এখনও চুপচাপ।',
  },
  'morning.emptyDesc': {
    en: 'When a wish you made comes true, you can mark it as fulfilled in your Personal Sky.',
    bn: 'তোমার কোনো ইচ্ছে সত্যি হলে নিজের আকাশে গিয়ে সেটা সত্যি হয়েছে বলে চিহ্নিত করতে পারবে।',
  },
  'morning.lookAtNight': { en: 'Look at the Night Sky', bn: 'রাতের আকাশ দেখো' },
  'morning.noteLabel': { en: 'The fulfillment:', bn: 'যা হয়েছিল:' },
  'morning.witnessed': {
    en: '{n} people witnessed this',
    bn: '{n} জন এটি দেখেছে',
  },
  'morning.fulfilledOn': { en: '• Fulfilled {date}', bn: '• সত্যি হয়েছে {date}' },
  'morning.loadFailed': {
    en: 'Failed to load Morning Sky',
    bn: 'ভোরের আকাশ আনা গেল না',
  },
  'morning.networkError': {
    en: 'Network error loading Morning Sky',
    bn: 'ভোরের আকাশ আনতে নেটওয়ার্কে সমস্যা হয়েছে',
  },

  // Constellations
  'constellations.eyebrow': { en: 'Shared Patterns', bn: 'সবার মাঝে মিল' },
  'constellations.title': { en: 'Constellations', bn: 'তারামণ্ডল' },
  'constellations.subtitle': {
    en: 'Strangers connected across the universe by common human threads.',
    bn: 'অচেনা মানুষেরা এক সুতোয় বাঁধা — একই রকম চাওয়া, একই রকম ব্যথা।',
  },
  'constellations.explore': {
    en: 'See it in the sky',
    bn: 'আকাশে দেখো',
  },
  'constellations.all': { en: 'All Constellations', bn: 'সব তারামণ্ডল' },
  'constellations.loading': { en: 'Tracing the stars...', bn: 'তারাগুলো মেলানো হচ্ছে…' },
  'constellations.starsConnected': {
    en: '{n} stars connected',
    bn: '{n} টি তারা একসাথে',
  },
  'constellations.emptyTitle': {
    en: 'No stars in this constellation yet.',
    bn: 'এই তারামণ্ডলে এখনও কোনো তারা নেই।',
  },
  'constellations.emptyDesc': {
    en: 'Leave a wish under {name} to be its first star.',
    bn: '{name}-এ একটি ইচ্ছে রেখে এর প্রথম তারা হয়ে যাও।',
  },
  'constellations.locateStar': { en: 'Locate Star', bn: 'তারাটি খুঁজে দাও' },
  'constellations.sentLight': {
    en: '{n} people sent light',
    bn: '{n} জন আলো পাঠিয়েছে',
  },
  'constellations.navLabel': {
    en: 'Constellation selection',
    bn: 'তারামণ্ডল বেছে নাও',
  },
  'constellations.loadFailed': {
    en: 'Failed to load constellations',
    bn: 'তারামণ্ডল আনা গেল না',
  },
  'constellations.wishesFailed': {
    en: 'Failed to load constellation wishes',
    bn: 'এই তারামণ্ডলের ইচ্ছেগুলো আনা গেল না',
  },

  // Personal Sky
  'personal.title': { en: 'Personal Sky', bn: 'নিজের আকাশ' },
  'personal.subtitle': {
    en: 'Your private sanctuary among the stars.',
    bn: 'তারার ভিড়ে তোমার নিজের গোপন জায়গা।',
  },
  'personal.loading': { en: 'Gathering your stars…', bn: 'তোমার তারাগুলো জড়ো করা হচ্ছে…' },
  'personal.emptyTitle': { en: 'The sky is quiet here.', bn: 'এখানকার আকাশ চুপচাপ।' },
  'personal.tabOwn': { en: 'My Wishes', bn: 'আমার ইচ্ছে' },
  'personal.tabSaved': { en: 'Saved Wishes', bn: 'সংগ্রহে রাখা' },
  'personal.tabLight': { en: 'Light Sent', bn: 'পাঠানো আলো' },
  'personal.emptyOwn': {
    en: "You haven't left a wish in the sky yet.",
    bn: 'তুমি এখনও আকাশে কোনো ইচ্ছে রাখোনি।',
  },
  'personal.emptySaved': {
    en: "You haven't saved any stranger's wish yet.",
    bn: 'তুমি এখনও কারও ইচ্ছে সংগ্রহে রাখোনি।',
  },
  'personal.emptyLight': {
    en: "You haven't sent light to any wish yet.",
    bn: 'তুমি এখনও কোনো ইচ্ছেতে আলো পাঠাওনি।',
  },
  'personal.unsave': { en: 'Unsave', bn: 'সংগ্রহ থেকে সরাও' },
  'personal.markFulfilled': { en: 'Mark as Fulfilled', bn: 'সত্যি হয়েছে বলো' },
  'personal.noteLabel': {
    en: 'Add an optional note about what happened:',
    bn: 'কী হয়েছিল, চাইলে লিখে রাখো:',
  },
  'personal.notePlaceholder': {
    en: 'It happened. I made it through.',
    bn: 'সত্যি হয়েছে। আমি পেরেছি।',
  },
  'personal.confirmFulfillment': { en: 'Confirm Fulfillment', bn: 'হ্যাঁ, সত্যি হয়েছে' },
  'personal.cancel': { en: 'Cancel', bn: 'বাতিল' },
  'personal.protect': { en: 'Protect this sky', bn: 'এই আকাশ সুরক্ষিত করো' },
  'personal.generating': { en: 'Generating…', bn: 'তৈরি হচ্ছে…' },
  'personal.protected': { en: '✦ Sky Protected', bn: '✦ আকাশ সুরক্ষিত' },
  'personal.recoverEntry': {
    en: 'Already have a sky? Recover it',
    bn: 'আগের আকাশ আছে? ফিরিয়ে আনো',
  },

  // Recovery phrase
  'recovery.phraseTitle': { en: 'Your Recovery Phrase', bn: 'তোমার ফিরে আসার শব্দগুলো' },
  'recovery.phraseSubtitle': {
    en: 'Use this phrase to reclaim your Personal Sky from any device.',
    bn: 'যেকোনো ডিভাইস থেকে নিজের আকাশ ফিরে পেতে এই শব্দগুলো ব্যবহার করো।',
  },
  'recovery.warningStrong': {
    en: "This is the only time you'll see this.",
    bn: 'এই একবারই তুমি এটা দেখতে পাবে।',
  },
  'recovery.warningRest': {
    en: 'Write it down or save it somewhere safe — if you lose it, there is no way to recover your sky. We cannot show it to you again.',
    bn: 'লিখে রাখো বা নিরাপদ কোথাও সংরক্ষণ করো — হারিয়ে গেলে এই আকাশ ফিরে পাওয়ার আর কোনো উপায় থাকবে না। আমরা এটা আর দেখাতে পারব না।',
  },
  'recovery.recoverTitle': { en: 'Recover Your Sky', bn: 'নিজের আকাশ ফিরিয়ে আনো' },
  'recovery.recoverSubtitle': {
    en: 'Enter the 4-word phrase you saved when you protected this sky.',
    bn: 'আকাশ সুরক্ষিত করার সময় যে চার শব্দ রেখেছিলে, সেগুলো লেখো।',
  },
  'recovery.phraseLabel': { en: 'Recovery phrase', bn: 'ফিরে আসার শব্দগুলো' },
  'recovery.recoverButton': { en: 'Recover Sky', bn: 'আকাশ ফিরিয়ে আনো' },
  'recovery.recovering': { en: 'Recovering…', bn: 'ফিরিয়ে আনা হচ্ছে…' },
  'recovery.copyLabel': {
    en: 'Copy recovery phrase to clipboard',
    bn: 'শব্দগুলো কপি করো',
  },
  'recovery.invalid': { en: 'Invalid recovery phrase.', bn: 'শব্দগুলো মিলছে না।' },
  'recovery.alreadySet': {
    en: 'A recovery phrase is already set for this sky.',
    bn: 'এই আকাশের জন্য আগেই শব্দগুলো ঠিক করা আছে।',
  },
  'recovery.generateFailed': {
    en: 'Could not generate recovery phrase.',
    bn: 'শব্দগুলো তৈরি করা গেল না।',
  },

  // Errors
  'error.generic': { en: 'An error occurred', bn: 'কিছু একটা ভুল হয়েছে' },
  'error.network': { en: 'Network error', bn: 'নেটওয়ার্কে সমস্যা হয়েছে' },
  'error.retry': {
    en: 'Network error. Please try again.',
    bn: 'নেটওয়ার্কে সমস্যা হয়েছে। আবার চেষ্টা করো।',
  },
  'error.tooShort': {
    en: 'Wish must be at least 3 characters',
    bn: 'ইচ্ছেটা অন্তত ৩ অক্ষরের হতে হবে',
  },
  'error.loadWishes': { en: 'Failed to load wishes', bn: 'ইচ্ছেগুলো আনা গেল না' },
  'error.createWish': { en: 'Failed to create wish', bn: 'ইচ্ছেটা রাখা গেল না' },
  'error.sendLight': { en: 'Failed to send light', bn: 'আলো পাঠানো গেল না' },
  'error.saveWish': {
    en: 'Could not update saved wish',
    bn: 'সংগ্রহ হালনাগাদ করা গেল না',
  },
  'error.close': { en: 'Close error message', bn: 'বার্তাটি বন্ধ করো' },
  'error.loadPersonal': {
    en: 'Failed to load personal sky',
    bn: 'নিজের আকাশ আনা গেল না',
  },
  'error.networkPersonal': {
    en: 'Network error loading personal sky',
    bn: 'নিজের আকাশ আনতে নেটওয়ার্কে সমস্যা হয়েছে',
  },
  'error.fulfill': {
    en: 'Could not mark wish as fulfilled',
    bn: 'ইচ্ছেটি সত্যি হয়েছে বলে চিহ্নিত করা গেল না',
  },
  'error.fulfillFailed': { en: 'Failed to fulfill wish', bn: 'কাজটি সম্পন্ন হয়নি' },

  // Relative time
  'time.justNow': { en: 'Just now', bn: 'এই মুহূর্তে' },
  'time.minutes': { en: '{n} minutes ago', bn: '{n} মিনিট আগে' },
  'time.minute': { en: '{n} minute ago', bn: '{n} মিনিট আগে' },
  'time.hours': { en: '{n} hours ago', bn: '{n} ঘণ্টা আগে' },
  'time.hour': { en: '{n} hour ago', bn: '{n} ঘণ্টা আগে' },
  'time.days': { en: '{n} days ago', bn: '{n} দিন আগে' },
  'time.day': { en: '{n} day ago', bn: '{n} দিন আগে' },
  'time.weeks': { en: '{n} weeks ago', bn: '{n} সপ্তাহ আগে' },
  'time.week': { en: '{n} week ago', bn: '{n} সপ্তাহ আগে' },
  'time.months': { en: '{n} months ago', bn: '{n} মাস আগে' },
  'time.month': { en: '{n} month ago', bn: '{n} মাস আগে' },
  'time.years': { en: '{n} years ago', bn: '{n} বছর আগে' },
  'time.year': { en: '{n} year ago', bn: '{n} বছর আগে' },
  'time.recently': { en: 'Recently', bn: 'কিছুক্ষণ আগে' },
} as const

export type StringKey = keyof typeof strings

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

/** Renders digits in Bengali numerals so Bangla copy isn't half-translated. */
export function localizeDigits(value: string | number, language: Language): string {
  const text = String(value)
  if (language !== 'bn') return text
  return text.replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)])
}

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Translate
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'
  } catch {
    // Private windows and blocked site data throw on access.
    return 'en'
  }
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

/** Translates a wish category slug, falling back to the raw slug if unknown. */
export function useCategoryLabel() {
  const { t } = useLanguage()
  return useCallback(
    (slug: string) => {
      const key = `category.${slug}` as StringKey
      return key in strings ? t(key) : slug
    },
    [t]
  )
}
