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
    let debug: any = { steps: [] };

    // Method 1: Find the push call with the daily data
    const pushMatch = html.match(/self\.\_\_next_f\.push\(\[1,\s*"9:({.+?})"\]\)/s);
    debug.steps.push({ method: 'pushMatch', found: !!pushMatch });

    if (pushMatch) {
      try {
        let jsonStr = pushMatch[1];
        debug.steps.push({ jsonStrLength: jsonStr.length, preview: jsonStr.substring(0, 200) });

        // Replace escaped quotes with regular quotes
        jsonStr = jsonStr.replace(/\\"/g, '"');
        debug.steps.push({ afterReplaceLength: jsonStr.length });

        const data = JSON.parse(jsonStr);
        debug.steps.push({ parsed: true, hasData: !!data.data, dataLength: data.data?.length });

        if (Array.isArray(data.data) && data.data.length > 0) {
          history = data.data
            .map((item: any) => ({
              date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fees: Math.round(item.totalUsd || 0),
              volume: Math.round((item.totalUsd || 0) * 50),
            }))
            .slice(-30);
        }
      } catch (e) {
        debug.steps.push({ method: 'pushMatch', error: String(e) });
      }
    }

    // Method 2: Find all self.__next_f.push calls and try each
    if (history.length === 0) {
      const allPushes = html.matchAll(/self\.\_\_next_f\.push\(\[1,\s*"9:({.+?})"\]\)/gs);
      let count = 0;
      for (const match of allPushes) {
        count++;
        try {
          let jsonStr = match[1].replace(/\\"/g, '"');
          const data = JSON.parse(jsonStr);
          if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].day) {
            history = data.data
              .map((item: any) => ({
                date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fees: Math.round(item.totalUsd || 0),
                volume: Math.round((item.totalUsd || 0) * 50),
              }))
              .slice(-30);
            debug.steps.push({ method: 'allPushes', foundAt: count });
            break;
          }
        } catch (e) {
          // Continue to next
        }
      }
      debug.steps.push({ method: 'allPushes', totalChecked: count });
    }

    // Method 3: Raw string extraction
    if (history.length === 0) {
      const rawMatch = html.match(/9:\\?({\\"data\\":\\?\[.+?\\?],\\"latestDay\\":.+?})/);
      debug.steps.push({ method: 'rawMatch', found: !!rawMatch });
      if (rawMatch) {
        try {
          let jsonStr = rawMatch[1].replace(/\\"/g, '"');
          const data = JSON.parse(jsonStr);
          if (Array.isArray(data.data)) {
            history = data.data
              .map((item: any) => ({
                date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fees: Math.round(item.totalUsd || 0),
                volume: Math.round((item.totalUsd || 0) * 50),
              }))
              .slice(-30);
            debug.steps.push({ method: 'rawMatch', success: true, count: history.length });
          }
        } catch (e) {
          debug.steps.push({ method: 'rawMatch', error: String(e) });
        }
      }
    }

    debug.steps.push({ finalHistoryLength: history.length });
    console.log('Revenue debug:', JSON.stringify(debug, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ fees24h, volume24h, history, debug }),
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
        debug: { error: String(error) },
      }),
    };
  }
};
