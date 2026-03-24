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
    
    const apiUrl = 'https://launch-mint-v1.raydium.io/get/list?platformId=FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1,82NMHVCKwehXgbXMyzL41mvv3sdkypaMCtTxvJ4CtTzm,BuM6KDpWiTcxvrpXywWFiw45R2RNH8WURdvqoTDV1BW4&sort=new&size=100&mintType=graduated&includeNsfw=true';
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (!result.success || !result.data || !Array.isArray(result.data.rows)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tokens: [], 
          total: 0,
          error: 'Invalid response structure',
          debug: { 
            hasSuccess: result.success,
            hasData: !!result.data,
            hasRows: !!(result.data && result.data.rows),
            rowsType: typeof result.data?.rows,
            isArray: Array.isArray(result.data?.rows)
          }
        }),
      };
    }
    
    const tokens = result.data.rows.map((token: any) => ({
      id: token.mint || token.id || String(Math.random()),
      name: token.name || 'Unknown',
      symbol: token.symbol || '$???',
      marketCap: token.marketCap || 0,
      volume24h: token.volumeU || token.volume24h || token.volume || token.vol || 0,
      priceChange24h: token.priceChange24h ?? token.price_change_24h ?? token.price_change ?? token.priceChange ?? token.change24h ?? token.change_24h ?? token.percent ?? token.priceChangePercent ?? 0,
      timestamp: token.createAt || token.created_at || token.createdAt || Date.now(),
      imageUrl: token.imgUrl || token.icon || token.image || token.logo || token.logoURI || '',
    }));

    // Sort by creation time (newest first)
    tokens.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const limit = timeRange === '24h' ? 20 : 100;
    const limitedTokens = tokens.slice(0, limit);
    
    // Check if there are more tokens by looking at the oldest token's timestamp
    // If the oldest token is within last 48h, there might be more
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oldestToken = tokens[tokens.length - 1];
    const oldestTokenAge = now - (oldestToken?.timestamp || now);
    const hasMore = tokens.length >= 100 && oldestTokenAge < (2 * oneDayMs);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        tokens: limitedTokens, 
        total: tokens.length,
        hasMore,
      }),
    };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch tokens', 
        details: String(error) 
      }),
    };
  }
};
