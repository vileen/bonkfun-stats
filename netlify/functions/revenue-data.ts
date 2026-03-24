import type { Handler } from '@netlify/functions';

// Static revenue data from revenue.letsbonk.fun
// In a real implementation, you would scrape this or use their API if available
const STATIC_REVENUE = {
  fees24h: 45000,
  volume24h: 2500000,
  totalRevenue: 1250000,
  distribution: [
    { name: 'Buy for BNKK', value: 51, color: '#f97316' },
    { name: 'Community Marketing', value: 10, color: '#3b82f6' },
    { name: 'BONKsol Staking', value: 10, color: '#22c55e' },
    { name: 'Hiring/Growth', value: 7.67, color: '#ec4899' },
    { name: 'Development', value: 7.67, color: '#06b6d4' },
    { name: '$GP Reserve', value: 7.67, color: '#a855f7' },
    { name: 'Marketing', value: 4, color: '#eab308' },
    { name: 'BonkRewards', value: 2, color: '#6366f1' },
  ],
  // Historical data - mock
  history: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fees: Math.floor(Math.random() * 30000) + 20000,
      volume: Math.floor(Math.random() * 2000000) + 1000000,
    };
  }),
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Try to fetch from revenue site
    // Note: This might not work due to CORS, but we'll try
    let revenueData = STATIC_REVENUE;
    
    try {
      const response = await fetch('https://revenue.letsbonk.fun/', {
        headers: {
          'Accept': 'text/html',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        // Try to extract data from HTML
        // Look for JSON data in script tags
        const jsonMatch = html.match(/window\.__NEXT_DATA__\s*=\s*({.+?});/);
        if (jsonMatch) {
          const nextData = JSON.parse(jsonMatch[1]);
          // Extract revenue data from Next.js data
          if (nextData?.props?.pageProps?.revenue) {
            revenueData = { ...revenueData, ...nextData.props.pageProps.revenue };
          }
        }
      }
    } catch (scrapeError) {
      console.log('Could not scrape revenue data, using static fallback');
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(revenueData),
    };
  } catch (error) {
    return {
      statusCode: 200, // Return static data even on error
      headers,
      body: JSON.stringify(STATIC_REVENUE),
    };
  }
};
