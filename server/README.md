## Live URL

**https://csci-3916-finalproject.onrender.com**
 for Smart Pantry & Expiry Guard, deployed as a Render web service.

## What it does

- Handles user sign up and login (credentials stored in MongoDB `users` collection)
- Serves and stores pantry items scoped per user in the `pantryItems` collection
- All responses include CORS headers so the static client can call the API

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Sign in to an existing account |
| GET | `/api/pantry/:username` | Fetch all items for a user |
| POST | `/api/pantry/:username` | Save a new item for a user |

## Main files

- `src/index.ts` - HTTP server, all route handlers, auth logic
- `src/db.ts` - MongoDB connection, `getPantryCollection`, `getUsersCollection`

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (set in Render dashboard)
- `PORT` - port to listen on (Render sets this automatically)

## Scripts

From the `server/` folder:

```
npm install    # installs deps and runs tsc via postinstall
npm run build  # compile TypeScript to dist/
npm start      # run dist/index.js
```

## Deployment

Deployed as a Render web service:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

`postinstall` in `package.json` runs `tsc` automatically so the `dist/` folder is ready before `npm start`.
