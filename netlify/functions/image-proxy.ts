import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get image URL from query parameter
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.status}` }),
      };
    }

    // Get the image data as buffer
    const imageBuffer = await response.arrayBuffer();

    // Get content type from original response
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return image with CORS headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
      body: Buffer.from(imageBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error proxying image:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to proxy image' }),
    };
  }
};
