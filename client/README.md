# Smart Pantry Client

This is the Next.js frontend for Smart Pantry & Expiry Guard.

## What it does

The client renders a retro pantry board where each item appears as a draggable post-it note. It also includes:

- a floating `+` button to open the add-item popup
- drag and drop for notes
- right-click panning on the canvas
- zoom controls and Ctrl/Cmd + wheel zoom
- expired-item deletion
- optimistic saving of new items

## Main files

- `src/app/page.tsx`: main dashboard, drag logic, add form, and MongoDB save request
- `src/app/globals.css`: all visual styling for the board, notes, modal, and animations
- `src/lib/pantry.ts`: pantry types, sample data, note sizing, and helper functions
- `src/app/api/pantry/route.ts`: Next.js API route that writes pantry items to MongoDB

## How saving works

When you click `Save Item`:

1. The form values are read from controlled inputs.
2. A new pantry item is added to local React state immediately.
3. A POST request is sent to `/api/pantry`.
4. The route stores the item in the `pantryItems` collection inside the `pantry` database.

## Environment

The client expects `MONGODB_URI` to be available in `client/.env.local` during development.

## Scripts

From the `client/` folder:

- `npm run dev` starts the Next.js dev server
- `npm run build` builds the app
- `npm run start` runs the production build
- `npm run lint` runs ESLint
