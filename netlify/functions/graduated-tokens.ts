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
    
    // Filter for graduated tokens (those with market cap > threshold or specific criteria)
    // You may need to adjust this filtering based on actual data structure
    const tokens = data.data || data || [];
    
    // Map to our format
    const graduatedTokens = tokens
      .filter((token: any) => token.marketCap > 50000 || token.isGraduated)
      .map((token: any) => ({
        id: token.mint || token.id,
        name: token.name,
        symbol: token.symbol,
        marketCap: token.marketCap || 0,
        volume24h: token.volume24h || token.volume || 0,
        priceChange24h: token.priceChange24h || ((token.priceChange || 0) * 100),
        timestamp: token.createdAt || Date.now(),
        imageUrl: token.icon || token.image || '',
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
