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
    const response = await fetch('https://revenue.letsbonk.fun/');
    const html = await response.text();

    // Extract 24h Volume and Fees from script c:{...}
    const scriptMatch = html.match(/c:\\?{"totalVolume":([\d.]+),"totalFees":([\d.]+)\\?}/);

    let volume24h = 15294178;
    let fees24h = 195238;

    if (scriptMatch) {
      volume24h = Math.round(parseFloat(scriptMatch[1]));
      fees24h = Math.round(parseFloat(scriptMatch[2]));
    }

    // Extract historical data from script 9:{...}
    let history: any[] = [];

    // The data is embedded in: self.__next_f.push([1, "9:{...}"])
    // Find all script tags and look for the one with daily data
    const scriptMatches = html.matchAll(/self\.\_\_next_f\.push\(\[1,\s*"9:({.+?})"\]\)/g);

    for (const match of scriptMatches) {
      try {
        let jsonStr = match[1];

        // Unescape the JSON string
        // The string contains escaped quotes like \" which need to become "
        jsonStr = jsonStr
          .replace(/\\"/g, '"')     // \\\" -> \"
          .replace(/\\n/g, '\n')     // \\n -> newline  
          .replace(/\\\\/g, '\\');   // \\\\ -> \

        const data = JSON.parse(jsonStr);

        // Check if this is the daily revenue data (has 'data' array with 'day' and 'totalUsd')
        if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].day && data.data[0].totalUsd !== undefined) {
          history = data.data
            .map((item: any) => ({
              date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fees: Math.round(item.totalUsd || 0),
              volume: Math.round((item.totalUsd || 0) * 50),
            }))
            .slice(-30);
          break; // Found it, stop searching
        }
      } catch (e) {
        // Continue to next match
        continue;
      }
    }

    // Fallback: try to extract from the raw HTML using a simpler pattern
    if (history.length === 0) {
      // Look for the data array directly in the HTML
      const dataMatch = html.match(/"data":(\[\{\"day\":\"[^\]]+\}\])/);
      if (dataMatch) {
        try {
          const dataArray = JSON.parse(dataMatch[1]);
          history = dataArray
            .map((item: any) => ({
              date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fees: Math.round(item.totalUsd || 0),
              volume: Math.round((item.totalUsd || 0) * 50),
            }))
            .slice(-30);
        } catch (e) {
          console.log('Failed to parse data array:', e);
        }
      }
    }

    if (history.length === 0) {
      console.log('No historical data found in response');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ fees24h, volume24h, history }),
    };
  } catch (error) {
    console.error('Error scraping revenue:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fees24h: 195238,
        volume24h: 15294178,
        history: [],
      }),
    };
  }
};
