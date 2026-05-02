# Smart Pantry & Expiry Guard

Smart Pantry & Expiry Guard is a split client/server project for tracking pantry items on a draggable post-it board.

## Live App

- Client: **https://csci-3916-finalproject-1.onrender.com/**
- Server: **https://csci-3916-finalproject.onrender.com**

## Project Structure

- `client/` - Next.js frontend with the pantry dashboard UI
- `server/` - TypeScript backend and HTTP server deployed on Render

## What the App Does

- Shows a sign in / sign up screen on load so each user sees their own pantry
- Displays pantry items as square post-it notes on a retro green workspace
- Color-coded status tags: green (Fresh), yellow (Expiring Soon), red (Expired)
- Lets you drag notes around, pan the canvas, and delete expired items
- Opens an add-item popup from the floating `+` button
- Saves new items to MongoDB scoped to the logged-in user
- Shopping list panel shows items at or below their minimum threshold

## How It Works

1. On load the user signs in or creates an account.
2. The client fetches that user's pantry items from the backend.
3. Items are rendered as post-it notes on the board.
4. When a new item is saved, the board updates immediately and the item is POSTed to the backend.
5. The backend stores items in MongoDB under the `pantry` database, `pantryItems` collection, tagged with the username.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Sign in to an existing account |
| GET | `/api/pantry/:username` | Fetch all items for a user |
| POST | `/api/pantry/:username` | Save a new item for a user |

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
  - Local client development: `client/.env.local`
  - Server deployment: set in Render dashboard

## Local Development

### Client

From the `client/` folder:

```
npm install
npm run dev
```

### Server

From the `server/` folder:

```
npm install
npm run build
npm start
```

## Deployment

- Client: Render static site — https://csci-3916-finalproject-1.onrender.com/ — Root Directory `client`, Build Command `npm install && npm run build`, Publish Directory `out`
- Server: Render web service — https://csci-3916-finalproject.onrender.com — Root Directory `server`, Build Command `npm install`, Start Command `npm start`
- `NEXT_PUBLIC_BACKEND_URL` on the client points to the deployed backend URL

## Main Files

- `client/src/app/page.tsx` - main dashboard, auth modal, add form, drag and save behavior
- `client/src/app/globals.css` - all visual styling
- `client/src/lib/pantry.ts` - pantry types and helper functions
- `server/src/index.ts` - backend entrypoint, auth and pantry routes
- `server/src/db.ts` - MongoDB connection, pantry and users collections
