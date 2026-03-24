# BONKfun Stats Dashboard

Combined dashboard for BONK.fun ecosystem metrics, aggregating data from:
- **bonk.fun/advanced** - Graduated tokens (with 24h filter)
- **revenue.letsbonk.fun** - Revenue distribution and 24h fees/volume
- **rewards.bonk.fun** - Daily reward pool and countdown

![Dashboard Preview](./preview.png)

## API Integration

This dashboard uses **real API endpoints** via Netlify Functions (serverless proxy):

### Endpoints Used

1. **`/.netlify/functions/rewards-status`** → `https://rewards.bonk.fun/api/status`
   - Returns: SOL pool, USD1 pool, graduated count, per bond reward

2. **`/.netlify/functions/graduated-tokens`** → Raydium API
   - Returns: List of graduated tokens with market data

3. **`/.netlify/functions/revenue-data`** → revenue.letsbonk.fun (scraped)
   - Returns: 24h fees, volume, historical data

### How It Works

Netlify Functions act as a **CORS proxy** - they make requests to external APIs from the server side (where CORS doesn't apply), then return the data to your frontend.

```
Frontend → Netlify Function → External API → Netlify Function → Frontend
```

## Development

### Pre-push Hook

This repo includes a git pre-push hook that runs TypeScript check before pushing:

```bash
# Hook is automatically installed in .git/hooks/pre-push
# To bypass in emergency: git push --no-verify
```

### Manual Type Check

```bash
npm run typecheck
# or
npm run build
```

### Local Development

```bash
# Install dependencies
npm install

# Run frontend + Netlify Functions locally
npx netlify dev

# Or just the frontend (functions won't work)
npm run dev
```

## Features

- **Graduated Tokens**: View top 100 or last 24h graduated tokens with market cap, volume, and price change
- **Revenue Metrics**: 24h fees, volume, and revenue distribution chart
- **Rewards Pool**: Live SOL and USD1 pool balance with countdown to next distribution
- **Auto-refresh**: Data updates automatically every 60 seconds

## Tech Stack

- React + TypeScript
- Vite
- Recharts (for charts)
- Lucide React (icons)
- Netlify Functions (CORS proxy)

## Deploy to Netlify

### Option 1: Deploy from GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repo
5. Build settings should auto-detect from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

Netlify will automatically detect and deploy the functions in `netlify/functions/`.

### Option 2: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (includes functions)
netlify deploy --prod
```

## Project Structure

```
bonkfun-stats/
├── netlify/
│   └── functions/          # Serverless functions (CORS proxy)
│       ├── rewards-status.ts
│       ├── graduated-tokens.ts
│       └── revenue-data.ts
├── src/
│   ├── App.tsx            # Main dashboard component
│   ├── App.css            # Styles
│   └── main.tsx           # Entry point
├── index.html             # HTML template
├── netlify.toml           # Netlify config
├── package.json
└── README.md
```

## Troubleshooting

### Functions not working locally?

Use `npx netlify dev` instead of `npm run dev` to run both frontend and functions.

### API returning errors?

Check the Netlify Function logs in your Netlify dashboard (Site → Functions → Logs).

## License

MIT
