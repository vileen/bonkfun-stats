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
    
    // Debug log
    console.log('Full API response:', JSON.stringify(result).slice(0, 1000));
    
    // Check response structure
    if (!result.success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tokens: [], 
          total: 0,
          error: 'API returned success=false',
          debug: { result }
        }),
      };
    }
    
    const tokens = result.data || [];
    
    if (!Array.isArray(tokens)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tokens: [], 
          total: 0,
          error: 'result.data is not an array',
          debug: { 
            dataType: typeof tokens,
            data: tokens
          }
        }),
      };
    }
    
    if (tokens.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tokens: [], 
          total: 0,
          error: 'No tokens in result.data',
          debug: { result }
        }),
      };
    }
    
    const mappedTokens = tokens.map((token: any) => ({
      id: token.mint || token.id || String(Math.random()),
      name: token.name || 'Unknown',
      symbol: token.symbol || '$???',
      marketCap: token.marketCap || token.market_cap || token.mc || 0,
      volume24h: token.volume24h || token.volume_24h || token.volume || token.vol || 0,
      priceChange24h: token.priceChange24h || token.price_change_24h || token.priceChange || 0,
      timestamp: token.createdAt || token.created_at || token.time || Date.now(),
      imageUrl: token.icon || token.image || token.logo || '',
    }));

    const limit = timeRange === '24h' ? 20 : 100;
    const limitedTokens = mappedTokens.slice(0, limit);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        tokens: limitedTokens, 
        total: mappedTokens.length 
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
