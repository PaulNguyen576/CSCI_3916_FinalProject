import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

interface PantryItem {
  id: number;
  barcode: string;
  productName: string;
  quantity: number;
  minThreshold: number;
  expiryDate: string;
  unitPrice: number;
  image: string;
}

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (client && client.topology?.isConnected()) {
    return client;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const body: PantryItem = await request.json();

    const c = await getClient();
    const db = c.db("pantry");
    const collection = db.collection("pantryItems");

    await collection.insertOne({
      ...body,
      createdAt: new Date(),
    } as any);

    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const c = await getClient();
    const db = c.db("pantry");
    const collection = db.collection("pantryItems");

    const items = await collection.find({}).toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
