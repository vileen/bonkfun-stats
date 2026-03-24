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
    const params = event.queryStringParameters || {};
    const timeRange = params.range || '24h';
    
    // Call Raydium API
    const apiUrl = 'https://launch-mint-v1.raydium.io/get/list?platformId=FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1,82NMHVCKwehXgbXMyzL41mvv3sdkypaMCtTxvJ4CtTzm,BuM6KDpWiTcxvrpXywWFiw45R2RNH8WURdvqoTDV1BW4&sort=new&size=100&mintType=graduated&includeNsfw=true';
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    // Extract tokens from result.data (Raydium API structure)
    const data = result.data || result;
    
    if (!Array.isArray(data)) {
      console.log('Unexpected response format:', typeof result, Object.keys(result));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tokens: [], total: 0, error: 'Invalid response format', debug: { resultKeys: Object.keys(result) } }),
      };
    }
    
    // Map tokens
    const tokens = data.map((token: any) => ({
      id: token.mint || token.id || String(Math.random()),
      name: token.name || 'Unknown',
      symbol: token.symbol || '$???',
      marketCap: token.marketCap || token.market_cap || 0,
      volume24h: token.volume24h || token.volume_24h || token.volume || 0,
      priceChange24h: token.priceChange24h || token.price_change_24h || 0,
      timestamp: token.createdAt || Date.now(),
      imageUrl: token.icon || token.image || '',
    }));

    // Limit based on range
    const limit = timeRange === '24h' ? 20 : 100;
    const limitedTokens = tokens.slice(0, limit);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tokens: limitedTokens, total: tokens.length }),
    };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch tokens', details: String(error) }),
    };
  }
};
