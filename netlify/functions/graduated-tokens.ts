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
    // Get query params
    const params = event.queryStringParameters || {};
    const timeRange = params.range || '24h';
    
    // Fetch from Raydium API
    const response = await fetch(
      'https://launch-mint-v1.raydium.io/get/list?platformId=FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1,82NMHVCKwehXgbXMyzL41mvv3sdkypaMCtTxvJ4CtTzm,BuM6KDpWiTcxvrpXywWFiw45R2RNH8WURdvqoTDV1BW4&sort=new&size=100&mintType=default&includeNsfw=true'
    );
    
    const data = await response.json();
    
    // Log the actual structure for debugging
    console.log('Raydium API response structure:', Object.keys(data));
    console.log('First item structure:', data[0] ? Object.keys(data[0]) : 'no items');
    
    // Raydium API returns array directly or nested in data property
    let tokens: any[] = [];
    if (Array.isArray(data)) {
      tokens = data;
    } else if (data.data && Array.isArray(data.data)) {
      tokens = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      tokens = data.items;
    } else if (data.tokens && Array.isArray(data.tokens)) {
      tokens = data.tokens;
    }
    
    if (tokens.length === 0) {
      console.log('No tokens found in response, returning empty array');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tokens: [], total: 0 }),
      };
    }
    
    // Map to our format - handle different field names
    const graduatedTokens = tokens
      .filter((token: any) => {
        // Check if token has graduated (marketCap > 69k or has graduated flag)
        const marketCap = token.marketCap || token.market_cap || token.mc || 0;
        const isGraduated = token.isGraduated || token.graduated || token.graduate || marketCap > 69000;
        return isGraduated || marketCap > 50000;
      })
      .map((token: any) => ({
        id: token.mint || token.id || token.address || String(Math.random()),
        name: token.name || 'Unknown',
        symbol: token.symbol || token.sym || '$???',
        marketCap: token.marketCap || token.market_cap || token.mc || 0,
        volume24h: token.volume24h || token.volume_24h || token.volume || token.vol || 0,
        priceChange24h: token.priceChange24h || token.price_change_24h || token.priceChange || 0,
        timestamp: token.createdAt || token.created_at || token.time || Date.now(),
        imageUrl: token.icon || token.image || token.logo || '',
      }));

    // Limit based on range
    const limit = timeRange === '24h' ? 20 : 100;
    const limitedTokens = graduatedTokens.slice(0, limit);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tokens: limitedTokens, total: graduatedTokens.length }),
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
