// Maps a product name to a stock Unsplash photo by keyword.
// Placeholder imagery until real product photos are uploaded.
// Specific keywords first so "cold brew" wins over "brew", etc.
const MAP: [string, string][] = [
  ["cold brew", "1461023058943-07fcbe16d735"],
  ["iced", "1517701550927-30cf4ba1dba5"],
  ["latte", "1561882468-9110e03e0f78"],
  ["cappuccino", "1572442388796-11668a67e53d"],
  ["flat white", "1494314671902-399b18174975"],
  ["espresso", "1510707577719-ae7c14805e3a"],
  ["americano", "1521302080334-4bebac2763a6"],
  ["mocha", "1578374173705-969cbe6f2d6b"],
  ["macchiato", "1485808191679-5f86510681a2"],
  ["tea", "1544787219-7f47ccb76574"],
  ["croissant", "1555507036-ab1f4038808a"],
  ["cheesecake", "1533134242443-d4fd215305ad"],
  ["brownie", "1606313564200-e75d5e30476c"],
  ["cookie", "1499636136210-6f4ee915583e"],
  ["muffin", "1607958996333-41aef7caefaa"],
  ["cake", "1565958011703-44f9829ba187"],
  ["panini", "1528736235302-52922df5c122"],
  ["sandwich", "1528735602780-2552fd46c7af"],
  ["pizza", "1513104890138-7c749659a591"],
  ["salad", "1512621776951-a57141f2eefd"],
  ["coffee", "1495474472287-4d71bcdd2085"],
];

const FALLBACK = "1495474472287-4d71bcdd2085";

export function productImage(name: string, w = 500): string {
  const n = name.toLowerCase();
  const hit = MAP.find(([k]) => n.includes(k));
  const id = hit ? hit[1] : FALLBACK;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
}
