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

import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

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
import { fetchPantryItemsFromDb, getPantryCollection } from "./db";

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

const port = Number(process.env.PORT || 10000);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.writeHead(statusCode, { ...corsHeaders, "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const parseRequestBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(raw);
};

const startServer = () => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = (req.url || "/").split("?")[0];

      if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
      }

      // attach CORS headers to every response
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

      if (req.method === "GET" && (url === "/" || url === "/health")) {
        sendJson(res, 200, { ok: true, service: "smart-pantry-server" });
        return;
      }

      if (req.method === "GET" && url === "/api/pantry") {
        const items = await getPantryViewItems();
        sendJson(res, 200, items);
        return;
      }

      if (req.method === "POST" && url === "/api/pantry") {
        const body = (await parseRequestBody(req)) as PantryItem;

        if (!body?.productName) {
          sendJson(res, 400, { error: "productName is required" });
          return;
        }

        const collection = await getPantryCollection();
        await collection.insertOne({
          ...body,
          barcode: body.barcode || "",
          image: body.image || "",
        });

        sendJson(res, 201, { success: true, id: body.id });
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      console.error("server error:", error);
      sendJson(res, 500, { error: "Internal server error" });
    }
  });

  server.listen(port, () => {
    console.log(`Smart Pantry server listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer();
}