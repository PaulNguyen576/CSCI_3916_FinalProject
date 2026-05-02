export type PantryItem = {
  id: number;
  barcode: string;
  productName: string;
  quantity: number;
  minThreshold: number;
  expiryDate: string;
  unitPrice: number;
  image: string;
};

export type PantryViewItem = PantryItem & {
  daysToExpiry: number;
};

export const pantryItems: PantryItem[] = [
  {
    id: 1,
    barcode: "0737628064502",
    productName: "Thai Peanut Noodle Kit",
    quantity: 1,
    minThreshold: 2,
    expiryDate: "2026-04-20",
    unitPrice: 4.75,
    image:
      "https://images.openfoodfacts.org/images/products/073/762/806/4502/front_en.6.200.jpg",
  },
  {
    id: 2,
    barcode: "3017620422003",
    productName: "Chocolate Hazelnut Spread",
    quantity: 0,
    minThreshold: 1,
    expiryDate: "2026-04-10",
    unitPrice: 6.2,
    image:
      "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.710.200.jpg",
  },
  {
    id: 3,
    barcode: "737628064502",
    productName: "Coconut Milk",
    quantity: 3,
    minThreshold: 2,
    expiryDate: "2026-05-09",
    unitPrice: 2.4,
    image:
      "https://images.openfoodfacts.org/images/products/073/762/806/4502/front_en.6.100.jpg",
  },
  {
    id: 4,
    barcode: "5449000000996",
    productName: "Sparkling Water",
    quantity: 1,
    minThreshold: 1,
    expiryDate: "2026-04-17",
    unitPrice: 1.5,
    image:
      "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.135.100.jpg",
  },
];

export const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 1500;
export const NOTE_SIZE = 230;

export const initialNotePositions: Record<number, { x: number; y: number }> = {
  1: { x: 180, y: 180 },
  2: { x: 640, y: 300 },
  3: { x: 1080, y: 170 },
  4: { x: 1540, y: 360 },
};

export const getDaysToExpiry = (expiryDate: string): number => {
  const now = new Date();
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - todayAtMidnight.getTime()) / DAY_IN_MS);
};

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
import { fetchPantryItemsFromDb } from "./db";

export async function fetchPantry(): Promise<PantryItem[]> {
  try {
    const docs = await fetchPantryItemsFromDb();
    if (docs && docs.length > 0) return docs;
  } catch (err) {
    console.error("fetchPantry fallback error:", err);
  }

  // fallback to static sample data
  return pantryItems;
}

export const getPantryViewItems = async (items?: PantryItem[]): Promise<PantryViewItem[]> => {
  const source = items ?? (await fetchPantry());
  return source
    .map((item) => ({ ...item, daysToExpiry: getDaysToExpiry(item.expiryDate) }))
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
};

export const getShoppingList = async (items?: PantryItem[]): Promise<PantryViewItem[]> => {
  const list = await getPantryViewItems(items);
  return list.filter((item) => item.quantity <= item.minThreshold);
};