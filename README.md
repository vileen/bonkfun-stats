# BONKfun Stats Dashboard

Combined dashboard for BONK.fun ecosystem metrics, aggregating data from:
- **bonk.fun/advanced** - Graduated tokens (with 24h filter)
- **revenue.letsbonk.fun** - Revenue distribution and 24h fees/volume
- **rewards.bonk.fun** - Daily reward pool and countdown

![Dashboard Preview](./preview.png)

## ⚠️ IMPORTANT: Mock Data Only

**This dashboard currently uses MOCK DATA (fake/example data).**

All numbers, token names, and charts are placeholder examples based on screenshots from the source sites. **No real API calls are being made.**

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

To use real data, you need to:
1. Find the actual API endpoints (see "Connecting to Real APIs" below)
2. Update the fetch functions in `src/App.tsx`
3. Handle CORS or use a proxy

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

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Netlify

### Option 1: Deploy from GitHub

1. Push this repo to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repo
5. Build settings should auto-detect from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 2: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Option 3: Drag & Drop

```bash
# Build the project
npm run build

# Then drag the 'dist' folder to Netlify's deploy page
```

## Connecting to Real APIs

Currently using mock data. To connect to real APIs:

### 1. Find API Endpoints

Use browser DevTools (Network tab) on the source sites to find:
- `bonk.fun/advanced` - Look for API calls fetching graduated tokens
- `revenue.letsbonk.fun` - Look for revenue/fees data endpoints
- `rewards.bonk.fun` - Look for reward pool and countdown endpoints

### 2. Update App.tsx

Replace mock data generators with actual fetch calls:

```typescript
// Example for graduated tokens
const fetchGraduatedTokens = async (timeRange: '24h' | '100') => {
  const response = await fetch('https://api.bonk.fun/graduated?range=' + timeRange);
  return response.json();
};

// In useEffect:
useEffect(() => {
  fetchGraduatedTokens(graduatedView).then(setGraduatedTokens);
}, [graduatedView]);
```

### 3. Handle CORS

If APIs don't support CORS, you have options:
- Use a CORS proxy (e.g., `https://cors-anywhere.herokuapp.com/`)
- Set up a Netlify Function as a proxy (see below)
- Contact API owners for access

### 4. Netlify Functions (Optional)

Create `netlify/functions/api.ts` for server-side API calls:

```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const response = await fetch('https://api.bonk.fun/data');
  const data = await response.json();
  
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

## Project Structure

```
bonkfun-stats/
├── src/
│   ├── App.tsx          # Main dashboard component
│   ├── App.css          # Styles
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── netlify.toml         # Netlify config
├── package.json
└── README.md
```

## Environment Variables

Create `.env` file for API keys (if needed):

```
VITE_API_KEY=your_api_key
VITE_API_URL=https://api.bonk.fun
```

## Customization

### Change Update Interval

In `App.tsx`, modify the `useEffect` hooks:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds instead of 60
  
  return () => clearInterval(interval);
}, []);
```

### Add New Data Sources

1. Add new interface in `App.tsx`
2. Create state with `useState`
3. Fetch data in `useEffect`
4. Add new section in JSX

## License

MIT
