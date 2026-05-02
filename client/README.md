# Smart Pantry Client

This is the Next.js frontend for Smart Pantry & Expiry Guard.

## Live URL

- Client: **https://csci-3916-finalproject-1.onrender.com/**
- Server: **https://csci-3916-finalproject.onrender.com**

## What it does

- Shows a sign in / sign up modal on load
- After login, fetches the user's pantry items from the backend and renders them as draggable post-it notes
- Color-coded status tags: green (Fresh), yellow (Expiring Soon), red (Expired)
- Floating `+` button opens the add-item form
- New items are saved optimistically to the board and POSTed to the backend scoped to the logged-in user
- Shopping list panel shows items at or below their minimum threshold
- Right-click drag to pan the canvas, zoom controls in the top-right corner
- Sign Out button returns to the auth screen

## Main files

- `src/app/page.tsx` - auth modal, board, drag logic, add form, per-user fetch and save
- `src/app/globals.css` - all visual styling for the board, notes, modal, and animations
- `src/lib/pantry.ts` - pantry types, note sizing constants, and helper functions
- `src/app/layout.tsx` - root layout with Google Fonts

## Environment

- `NEXT_PUBLIC_BACKEND_URL` - points the client at the deployed backend (set in Render or `.env.local`)
- `MONGODB_URI` - only needed locally if running the Next.js dev server with direct DB access

## Scripts

From the `client/` folder:

```
npm run dev      # start the Next.js dev server
npm run build    # build and export static files to out/
npm run lint     # run ESLint
```

## Deployment

Deployed as a Render static site:

- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `out`
