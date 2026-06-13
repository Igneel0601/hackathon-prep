// Curated Unsplash imagery for the café POS. Maps a product (by name keyword,
// then by category) to a stable Unsplash photo. Returns a CDN URL with sizing
// params so callers can request an appropriately-sized, auto-formatted image.
//
// All IDs are stable Unsplash photo IDs (images.unsplash.com/photo-<id>), which
// is allow-listed in next.config.ts remotePatterns.

const BASE = "https://images.unsplash.com/photo-";

/** Stable Unsplash photo IDs, grouped by what they depict. */
const PHOTOS = {
  espresso: "1510591509098-f4fdc6d0ff04",
  cappuccino: "1572442388796-11668a67e53d",
  latte: "1461023058943-07fcbe16d735",
  coldBrew: "1517701550927-30cf4ba1dba5",
  coffeeGeneric: "1495474472287-4d71bcdd2085",
  tea: "1544787219-7f47ccb76574",
  sandwich: "1528735602780-2552fd46c7af",
  pizza: "1513104890138-7c749659a591",
  burger: "1568901346375-23c9450c58cd",
  pasta: "1551183053-bf91a1d81141",
  salad: "1512621776951-a57141f2eefd",
  friesSnack: "1573080496219-bb080dd4f877",
  foodGeneric: "1504674900247-0877df9cc836",
  brownie: "1606313564200-e75d5e30476c",
  cake: "1578985545062-69928b1d9587",
  croissant: "1555507036-ab1f4038808a",
  cookie: "1499636136210-6f4ee915583e",
  dessertGeneric: "1488477181946-6428a0291777",
} as const;

type PhotoKey = keyof typeof PHOTOS;

/** Keyword → photo. First match wins, so order most-specific first. */
const KEYWORD_MAP: [RegExp, PhotoKey][] = [
  [/espresso|americano|macchiato|ristretto/i, "espresso"],
  [/cappuccino|flat white|cortado/i, "cappuccino"],
  [/latte|mocha/i, "latte"],
  [/cold ?brew|iced|frapp/i, "coldBrew"],
  [/tea|chai|matcha/i, "tea"],
  [/coffee|brew|drip/i, "coffeeGeneric"],
  [/sandwich|panini|sub|wrap|toast/i, "sandwich"],
  [/pizza|margherita/i, "pizza"],
  [/burger/i, "burger"],
  [/pasta|noodle|spaghetti/i, "pasta"],
  [/salad|bowl/i, "salad"],
  [/fries|nachos|chips|snack/i, "friesSnack"],
  [/brownie/i, "brownie"],
  [/cake|cheesecake|tart|pastry/i, "cake"],
  [/croissant|bun|roll/i, "croissant"],
  [/cookie|biscuit/i, "cookie"],
];

/** Fallback per category name (case-insensitive substring). */
const CATEGORY_MAP: [RegExp, PhotoKey][] = [
  [/coffee|drink|beverage/i, "coffeeGeneric"],
  [/dessert|sweet|bakery|pastr/i, "dessertGeneric"],
  [/food|meal|main|snack/i, "foodGeneric"],
];

function urlFor(key: PhotoKey, w: number): string {
  return `${BASE}${PHOTOS[key]}?w=${w}&q=80&auto=format&fit=crop`;
}

/**
 * Resolve a product image URL.
 * @param name product name (matched by keyword)
 * @param categoryName optional category name (fallback)
 * @param width requested CDN width (default 400)
 */
export function getProductImage(
  name: string,
  categoryName?: string | null,
  width = 400,
): string {
  for (const [re, key] of KEYWORD_MAP) {
    if (re.test(name)) return urlFor(key, width);
  }
  if (categoryName) {
    for (const [re, key] of CATEGORY_MAP) {
      if (re.test(categoryName)) return urlFor(key, width);
    }
  }
  return urlFor("foodGeneric", width);
}

/** Hero / ambience imagery used on landing + login. */
export const CAFE_IMAGERY = {
  /** Warm café interior — landing/login hero. */
  interior: `${BASE}1554118811-1e0d58224f24?w=1600&q=80&auto=format&fit=crop`,
  /** Barista pouring — secondary hero. */
  pour: `${BASE}1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop`,
  /** Latte art close-up — login panel. */
  latteArt: `${BASE}1509042239860-f550ce710b93?w=1200&q=80&auto=format&fit=crop`,
} as const;
