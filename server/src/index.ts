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
import { fetchPantryItemsFromDb, getPantryCollection, getUsersCollection } from "./db";

export const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 1500;
export const NOTE_SIZE = 230;

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

export const getPantryViewItems = (items: PantryItem[]): PantryViewItem[] =>
  items
    .map((item) => ({ ...item, daysToExpiry: getDaysToExpiry(item.expiryDate) }))
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

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
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
};

// simple hash — no native crypto dependency issues
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (Math.imul(31, hash) + password.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
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

      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

      if (req.method === "GET" && (url === "/" || url === "/health")) {
        sendJson(res, 200, { ok: true, service: "smart-pantry-server" });
        return;
      }

      // --- AUTH ---
      if (req.method === "POST" && url === "/api/auth/signup") {
        const body = (await parseRequestBody(req)) as { username: string; password: string };
        if (!body?.username || !body?.password) {
          sendJson(res, 400, { error: "username and password required" });
          return;
        }
        const users = await getUsersCollection();
        const existing = await users.findOne({ username: body.username });
        if (existing) {
          sendJson(res, 409, { error: "Username already taken" });
          return;
        }
        await users.insertOne({ username: body.username, password: hashPassword(body.password) });
        sendJson(res, 201, { success: true, username: body.username });
        return;
      }

      if (req.method === "POST" && url === "/api/auth/login") {
        const body = (await parseRequestBody(req)) as { username: string; password: string };
        if (!body?.username || !body?.password) {
          sendJson(res, 400, { error: "username and password required" });
          return;
        }
        const users = await getUsersCollection();
        const user = await users.findOne({ username: body.username, password: hashPassword(body.password) });
        if (!user) {
          sendJson(res, 401, { error: "Invalid username or password" });
          return;
        }
        sendJson(res, 200, { success: true, username: body.username });
        return;
      }

      // --- PANTRY (scoped by user) ---
      if (req.method === "GET" && url.startsWith("/api/pantry/")) {
        const username = url.split("/api/pantry/")[1];
        const collection = await getPantryCollection();
        const docs = await collection.find({ username }).toArray();
        sendJson(res, 200, getPantryViewItems(docs));
        return;
      }

      if (req.method === "POST" && url.startsWith("/api/pantry/")) {
        const username = url.split("/api/pantry/")[1];
        const body = (await parseRequestBody(req)) as PantryItem;
        if (!body?.productName) {
          sendJson(res, 400, { error: "productName is required" });
          return;
        }
        const collection = await getPantryCollection();
        await collection.insertOne({ ...body, username, barcode: body.barcode || "", image: body.image || "" });
        sendJson(res, 201, { success: true, id: body.id });
        return;
      }

      // legacy unscoped GET (kept for backwards compat)
      if (req.method === "GET" && url === "/api/pantry") {
        const items = await fetchPantryItemsFromDb();
        sendJson(res, 200, getPantryViewItems(items));
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
