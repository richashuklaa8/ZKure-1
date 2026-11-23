# Render deployment

Use a single Render Web Service for the combined Express API and built Vite frontend.

- Root Directory: blank
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Node version: 24 (from `.nvmrc`)

Set `NODE_ENV=production`, `HOST=0.0.0.0`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and `RECORD_ENCRYPTION_KEY` in Render's Environment settings. Generate the encryption key locally; never commit it.

For persistent SQLite storage, attach a persistent disk and set `DATABASE_PATH` to a file path on the disk mount. Render ephemeral storage can be lost on restart or redeploy. Do not use real patient data.
