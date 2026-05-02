# Smart Pantry & Expiry Guard

Smart Pantry & Expiry Guard is a split client/server project for tracking pantry items on a draggable post-it board.

## Project Structure

- `client/` - Next.js frontend with the pantry dashboard UI
- `server/` - TypeScript backend helpers and a small HTTP server for Render

## What the App Does

- Displays pantry items as square post-it notes on a retro green workspace
- Lets you drag notes around, pan and zoom the canvas, and delete expired items
- Opens an add-item popup from the floating `+` button
- Saves new items to MongoDB through the backend API flow

## How It Works

1. The client loads pantry data and renders it as notes.
2. When you save a new item, the client updates the board immediately.
3. The client sends the new item to the backend endpoint.
4. The backend stores items in MongoDB under the `pantry` database and `pantryItems` collection.

## Environment Variables

The app expects a MongoDB connection string in `MONGODB_URI`.

- Local client development: `client/.env.local`
- Server deployment: environment variables set in Render

## Local Development

### Client

From the `client/` folder:

- `npm install`
- `npm run dev`

### Server

From the `server/` folder:

- `npm install`
- `npm run build`
- `npm start`

## Deployment Notes

- The Render backend should use `server/` as the root directory.
- `server/package.json` builds on install so Render gets `dist/index.js` before startup.
- The frontend should be deployed as a Render static site.
- `render.yaml` configures the client service with `rootDir: client`, `runtime: static`, and `staticPublishPath: out`.
- The frontend points at the deployed backend URL through `NEXT_PUBLIC_BACKEND_URL`.

## Main Files

- `client/src/app/page.tsx` - main dashboard, add form, drag and save behavior
- `client/src/app/api/pantry/route.ts` - API route that writes to MongoDB
- `client/src/lib/pantry.ts` - pantry types, sample data, and helpers
- `server/src/index.ts` - backend entrypoint and pantry helpers
- `server/src/db.ts` - MongoDB connection helper
