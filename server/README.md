# Smart Pantry & Expiry Guard

This repository is split into two parts:

- `client/`: the Next.js app that renders the pantry board UI
- `server/`: TypeScript helpers for MongoDB access and shared pantry logic

## What the app does

The app is a retro-style pantry dashboard where each grocery item appears as a draggable post-it note on a green cutting-mat canvas. Items are marked as:

- fresh
- expiring soon
- expired

Users can:

- drag notes around the board
- pan and zoom the canvas
- add new pantry items from the floating `+` button
- delete expired notes

## Current code structure

### Client UI

The main UI lives in `client/src/app/page.tsx`.

That file handles:

- rendering the board
- note drag and drop
- zoom and panning interactions
- the add-item popup form
- saving new items to MongoDB through the API route

Supporting pantry data and helper functions live in `client/src/lib/pantry.ts`.

### MongoDB API route

The client also contains a Next.js route at `client/src/app/api/pantry/route.ts`.

That route:

- reads `MONGODB_URI` from environment variables
- connects to MongoDB
- stores items in the `pantry` database
- writes documents to the `pantryItems` collection
- exposes a `GET` endpoint for reading items back

### Server helpers

The `server/` folder holds shared backend logic for MongoDB access:

- `server/src/db.ts` connects to MongoDB and fetches pantry items
- `server/src/index.ts` defines pantry types and helper functions for fallback/sample data

This folder is currently a helper layer rather than a separate running API service.

## Data flow

1. The page loads pantry items.
2. The board renders them as post-it notes.
3. When the user saves a new item, the client updates local state immediately.
4. The client then POSTs the new item to `/api/pantry`.
5. The route saves the item into MongoDB under `pantry.pantryItems`.

If MongoDB is unavailable, the UI can still fall back to sample pantry data in the helper layer.

## Environment variables

The app expects:

- `MONGODB_URI`: MongoDB connection string

The client reads this from `client/.env.local` during local development.

## Server scripts

From the `server/` folder:

- `npm run build` compiles the TypeScript files
- `npm start` runs the compiled output from `dist/index.js`

## Notes

- The client uses Next.js 16 and React 19.
- Pantry notes are square, draggable, and layered so the active drag stays on top.
- The starter sample data is intentionally small so new items are easy to test.
