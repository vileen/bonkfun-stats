import type { Handler } from '@netlify/functions';

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
    // Fetch the HTML page
    const response = await fetch('https://revenue.letsbonk.fun/');
    const html = await response.text();
    
    // Extract __NEXT_DATA__
    const nextDataMatch = html.match(/self\.__next_f\.push\(\[1,"c:(\{.+?})"\]\)/);
    
    if (!nextDataMatch) {
      throw new Error('Could not find __NEXT_DATA__');
    }
    
    // Parse the JSON (need to unescape it)
    const jsonStr = nextDataMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '');
    const data = JSON.parse(jsonStr);
    
    // The data structure from the HTML
    const revenueData = {
      fees24h: Math.round(data.totalFees || 195238),
      volume24h: Math.round(data.totalVolume || 15294178),
      history: [] as any[],
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(revenueData),
    };
  } catch (error) {
    console.error('Error scraping revenue:', error);
    // Return fallback data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fees24h: 195238,
        volume24h: 15294178,
        error: String(error),
      }),
    };
  }
};
