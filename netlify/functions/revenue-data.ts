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
    // Format: c:{"totalVolume":15294177.54867579,"totalFees":195237.86}
    const scriptMatch = html.match(/c:\\?{"totalVolume":([\d.]+),"totalFees":([\d.]+)\\?}/);

    let volume24h = 15294178;
    let fees24h = 195238;

    if (scriptMatch) {
      volume24h = Math.round(parseFloat(scriptMatch[1]));
      fees24h = Math.round(parseFloat(scriptMatch[2]));
    }

    // Extract historical data from script 9:{...}
    // The data is in: self.__next_f.push([1, "9:{\\\"data\\\":[...],...}"])
    let history: any[] = [];

    // Find the script containing the daily revenue data
    // Look for the pattern: "9:{\"data\":[...],\"latestDay\":...}
    const historyMatch = html.match(/"9:({\\"data\\":\[.+?],\\"latestDay\\":\\"[^\\"]+\\",\\"stalenessDays\\":[\d.]+,\\"error\\":null})"/);

    if (historyMatch) {
      try {
        // The captured group contains double-escaped JSON
        // First, extract the raw string and unescape it
        let jsonStr = historyMatch[1];

        // Unescape: \\\" -> \" -> "
        // The string is double-escaped because it's inside an HTML script string
        jsonStr = jsonStr
          .replace(/\\"/g, '"')      // \\\" -> \"
          .replace(/\\n/g, '\n')      // \\n -> newline
          .replace(/\\\\/g, '\\');    // \\\\ -> \

        const historyData = JSON.parse(jsonStr);

        if (Array.isArray(historyData.data) && historyData.data.length > 0) {
          // Map to chart format and take last 30 days
          history = historyData.data
            .map((item: any) => ({
              date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fees: Math.round(item.totalUsd || 0),
              volume: Math.round((item.totalUsd || 0) * 50),
            }))
            .slice(-30);
        }
      } catch (e) {
        console.log('Failed to parse history from match:', e);
      }
    }

    // Fallback: try alternative pattern if first one failed
    if (history.length === 0) {
      // Try to find any self.__next_f.push that contains daily data with totalUsd
      const altMatch = html.match(/self\.\_\_next_f\.push\(\[1,\s*"9:({.+?})"\]\)/s);
      if (altMatch) {
        try {
          let jsonStr = altMatch[1];
          // Multiple unescape passes needed
          while (jsonStr.includes('\\"')) {
            jsonStr = jsonStr.replace(/\\"/g, '"');
          }
          jsonStr = jsonStr.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

          const historyData = JSON.parse(jsonStr);
          if (Array.isArray(historyData.data)) {
            history = historyData.data
              .map((item: any) => ({
                date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fees: Math.round(item.totalUsd || 0),
                volume: Math.round((item.totalUsd || 0) * 50),
              }))
              .slice(-30);
          }
        } catch (e) {
          console.log('Failed to parse alt history:', e);
        }
      }
    }

    if (history.length === 0) {
      console.log('No historical data found');
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
