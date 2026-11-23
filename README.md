# ZKure

ZKure is the project repository for the supplied ArogyaZK React and Express prototype. The original prototype application, screens, components, styles, routes, and server implementation are retained from the supplied `arogyazk-main` source. Repository and package metadata are named **ZKure**; deployment support is added without redesigning the interface.

## Run locally (Windows PowerShell)

Requirements: Node.js 24 and npm.

```powershell
npm ci
$env:BOOTSTRAP_ADMIN_EMAIL = 'admin@example.test'
$env:BOOTSTRAP_ADMIN_PASSWORD = 'replace-with-a-unique-password-at-least-12-characters'
$env:RECORD_ENCRYPTION_KEY = (node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm run dev
```

Open the Vite app at `http://localhost:3000`. The Express API runs on port `3001`.

## Build and test

```powershell
npm run build
npm run test:security
npm start
```

`npm start` runs the Express server. After `npm run build`, the server also serves the compiled frontend from `dist/`.

## Deploy to Render

Create one **Web Service** connected to this repository.

- **Root Directory:** leave blank
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

Set these environment variables in Render:

- `NODE_ENV` = `production`
- `HOST` = `0.0.0.0`
- `BOOTSTRAP_ADMIN_EMAIL` = your chosen admin email
- `BOOTSTRAP_ADMIN_PASSWORD` = a unique password of at least 12 characters
- `RECORD_ENCRYPTION_KEY` = a securely generated 64-character hexadecimal key (32 bytes)

Do not commit real secrets or put them in this README. For durable SQLite data, configure a persistent disk and set `DATABASE_PATH` to a path on its mount (for example `/var/data/zkure.db`). Render's ephemeral filesystem does not provide durable database storage.

## Important prototype limitations

The supplied source README documents the current integration limits:

- No Circom circuit, witness generator, proving key, verification key, or Solidity verifier is included.
- No Sepolia RPC/signing configuration or payment contract is included.
- Break-glass requests and guardian signatures remain disabled pending real cryptographic verification and secret reconstruction.
- FHIR R4 and ABDM validation are not implemented.
- SQLite and in-memory rate limiting require additional production hardening.
- Use synthetic demonstration data only. Do not upload real patient records or use real funds.

See `docs/backend-architecture.md` and the source implementation for additional details. The presence of a prototype screen or demo data does not mean its corresponding production integration is operational.

## Repository

The repository is intended to be named `ZKure`. Upload the contents of this ZIP to the root of that GitHub repository (not the ZIP file itself).
