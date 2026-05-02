import { MongoClient, Collection } from "mongodb";
import "dotenv/config";
import type { PantryItem } from "./index";

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI;

let client: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (client && client.topology?.isConnected()) {
    return client;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment");
  }

  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getPantryCollection(): Promise<Collection<PantryItem>> {
  const c = await getClient();
  const dbName = c.db().databaseName || "pantry";
  return c.db(dbName).collection<PantryItem>("pantryItems");
}

export async function fetchPantryItemsFromDb(): Promise<PantryItem[]> {
  try {
    const coll = await getPantryCollection();
    const docs = await coll.find({}).toArray();
    return docs;
  } catch (err) {
    console.error("fetchPantryItemsFromDb error:", err);
    return [];
  }
}

export async function closeClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
