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

export const pantryItems: PantryItem[] = [];

export const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 1500;
export const NOTE_SIZE = 268;

export const initialNotePositions: Record<number, { x: number; y: number }> = {};

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

export const getPantryViewItems = (items: PantryItem[] = pantryItems): PantryViewItem[] =>
  items
    .map((item) => ({ ...item, daysToExpiry: getDaysToExpiry(item.expiryDate) }))
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

export const getShoppingList = (items: PantryViewItem[] = getPantryViewItems()): PantryViewItem[] =>
  items.filter((item) => item.quantity <= item.minThreshold);