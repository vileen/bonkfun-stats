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
    const apiUrl = 'https://launch-mint-v1.raydium.io/get/list?platformId=FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1,82NMHVCKwehXgbXMyzL41mvv3sdkypaMCtTxvJ4CtTzm,BuM6KDpWiTcxvrpXywWFiw45R2RNH8WURdvqoTDV1BW4&sort=new&size=100&mintType=graduated&includeNsfw=true';
    
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    
    // Debug: zwróć surowe dane żeby zobaczyć co jest
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Data keys:', Object.keys(data));
    
    // Jeśli to array, użyj go bezpośrednio
    let tokens: any[] = [];
    if (Array.isArray(data)) {
      tokens = data;
    } else if (data && typeof data === 'object') {
      // Sprawdź wszystkie możliwe właściwości
      const possibleArrays = ['data', 'items', 'tokens', 'list', 'results'];
      for (const key of possibleArrays) {
        if (Array.isArray(data[key])) {
          tokens = data[key];
          console.log(`Found tokens in data.${key}, count:`, tokens.length);
          break;
        }
      }
    }
    
    console.log('Total tokens found:', tokens.length);
    
    if (tokens.length === 0) {
      // Debug: zwróć co zwróciło API
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tokens: [], 
          total: 0, 
          debug: {
            dataType: typeof data,
            isArray: Array.isArray(data),
            dataKeys: Object.keys(data),
            sample: Array.isArray(data) ? data.slice(0, 2) : null
          }
        }),
      };
    }
    
    // Map tokens
    const graduatedTokens = tokens.map((token: any) => ({
      id: token.mint || token.id || token.address || String(Math.random()),
      name: token.name || 'Unknown',
      symbol: token.symbol || token.sym || '$???',
      marketCap: token.marketCap || token.market_cap || token.mc || 0,
      volume24h: token.volume24h || token.volume_24h || token.volume || token.vol || 0,
      priceChange24h: token.priceChange24h || token.price_change_24h || token.priceChange || 0,
      timestamp: token.createdAt || token.created_at || token.time || Date.now(),
      imageUrl: token.icon || token.image || token.logo || '',
    }));

    // Limit
    const limit = timeRange === '24h' ? 20 : 100;
    const limitedTokens = graduatedTokens.slice(0, limit);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        tokens: limitedTokens, 
        total: graduatedTokens.length 
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch tokens', details: String(error) }),
    };
  }
};
