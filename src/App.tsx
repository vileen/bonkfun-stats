import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trophy, DollarSign, Clock, TrendingUp, Wallet, Flame, ExternalLink, Info } from 'lucide-react';
import './App.css';

// Types
interface GraduatedToken {
  id: string;
  name: string;
  symbol: string;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: number;
  imageUrl?: string;
}

interface HistoricalRevenue {
  date: string;
  fees: number;
  volume: number;
}

interface RewardsData {
  solPool: number;
  usd1Pool: number;
  graduatedToday: number;
  perBond: number;
  nextDistribution: number;
}

// Fetch graduated tokens via Netlify Function (proxies to Raydium API)
const fetchGraduatedTokens = async (timeRange: '100' | '24h'): Promise<{ tokens: GraduatedToken[]; hasMore: boolean }> => {
  try {
    const response = await fetch(`/.netlify/functions/graduated-tokens?range=${timeRange}`);
    if (!response.ok) throw new Error('Failed to fetch tokens');
    const data = await response.json();
    return { tokens: data.tokens || [], hasMore: data.hasMore || false };
  } catch (error) {
    console.error('Error fetching graduated tokens:', error);
    return { tokens: [], hasMore: false };
  }
};

// Fetch yesterday's graduated count separately (uses full 100 list)
const fetchYesterdayStats = async (solPool: number): Promise<{ count: number; perBond: number; hasMore: boolean }> => {
  try {
    const response = await fetch('/.netlify/functions/graduated-tokens?range=100');
    if (!response.ok) throw new Error('Failed to fetch tokens');
    const data = await response.json();
    const tokens: GraduatedToken[] = data.tokens || [];
    const apiHasMore = data.hasMore || false;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayStart = now - 2 * oneDayMs;
    const yesterdayEnd = now - oneDayMs;

    const yesterdayTokens = tokens.filter((t: GraduatedToken) => {
      const ts = t.timestamp || 0;
      return ts >= yesterdayStart && ts < yesterdayEnd;
    });

    const count = yesterdayTokens.length;
    const perBond = count > 0 ? (solPool / count) : 0;

    // Yesterday has more if:
    // 1. API returned 100 tokens (apiHasMore = true) AND
    // 2. The oldest token is from yesterday (meaning we cut off some yesterday tokens)
    const oldestToken = tokens[tokens.length - 1];
    const oldestTokenTime = oldestToken?.timestamp || 0;
    const yesterdayHasMore = apiHasMore && oldestTokenTime >= yesterdayStart;

    return { count, perBond, hasMore: yesterdayHasMore };
  } catch (error) {
    console.error('Error fetching yesterday stats:', error);
    return { count: 0, perBond: 0, hasMore: false };
  }
};

// Fetch revenue data via Netlify Function
const fetchRevenueData = async () => {
  try {
    const response = await fetch('/.netlify/functions/revenue-data');
    if (!response.ok) throw new Error('Failed to fetch revenue');
    const data = await response.json();
    return {
      fees24h: data.fees24h || 195238,
      volume24h: data.volume24h || 15294178,
      history: data.history || [],
    };
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return { fees24h: 195238, volume24h: 15294178, history: [] };
  }
};

// Fetch rewards data from rewards.bonk.fun API
const fetchRewardsData = async (): Promise<RewardsData> => {
  try {
    const response = await fetch('/.netlify/functions/rewards-status');
    if (!response.ok) throw new Error('Failed to fetch rewards');
    const data = await response.json();
    
    // Parse the response - match actual API field names from rewards.bonk.fun
    return {
      solPool: data.balance_sol || 0,
      usd1Pool: data.balance_usd1 || 0,
      graduatedToday: data.graduated_count || 0,
      perBond: data.balance_sol && data.graduated_count ? data.balance_sol / data.graduated_count : 0,
      nextDistribution: Date.now() + 3600000,
    };
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return {
      solPool: 0,
      usd1Pool: 0,
      graduatedToday: 0,
      perBond: 0,
      nextDistribution: Date.now() + 3600000,
    };
  }
};

function App() {
  const [graduatedView, setGraduatedView] = useState<'today' | '24h' | 'yesterday' | '100'>('today');
  const [graduatedTokens, setGraduatedTokens] = useState<GraduatedToken[]>([]);
  const [allTokens, setAllTokens] = useState<GraduatedToken[]>([]);
  const [graduatedYesterday, setGraduatedYesterday] = useState({ count: 0, perBond: 0, hasMore: false });
  const [graduatedToday, setGraduatedToday] = useState({ count: 0, hasMore: false });
  const [tokensHasMore, setTokensHasMore] = useState(false);
  const [historicalRevenue, setHistoricalRevenue] = useState<HistoricalRevenue[]>([]);
  const [rewards, setRewards] = useState<RewardsData>({
    solPool: 0,
    usd1Pool: 0,
    graduatedToday: 0,
    perBond: 0,
    nextDistribution: 0,
  });
  const [revenue24h, setRevenue24h] = useState({ fees: 45000, volume: 2500000 });
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [tokensLoading, setTokensLoading] = useState(false);

  // Calculate today's graduated count from tokens (since 00:00 UTC)
  const calculateTodayStats = (tokens: GraduatedToken[], apiHasMore: boolean) => {
    const now = new Date();
    const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const todayTokens = tokens.filter(t => {
      const ts = t.timestamp || 0;
      return ts >= utcMidnight;
    });

    const count = todayTokens.length;

    // Today has more if API hit limit and we have tokens from today
    const todayHasMore = apiHasMore && count > 0;

    setGraduatedToday({ count, hasMore: todayHasMore });
  };

  // Filter tokens based on view
  const filterTokensByView = (tokens: GraduatedToken[], view: 'today' | '24h' | 'yesterday' | '100'): GraduatedToken[] => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const utcMidnight = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());

    switch (view) {
      case 'today':
        return tokens.filter(t => (t.timestamp || 0) >= utcMidnight);
      case '24h':
        return tokens.filter(t => (t.timestamp || 0) >= now - oneDayMs);
      case 'yesterday':
        const yesterdayStart = now - 2 * oneDayMs;
        const yesterdayEnd = now - oneDayMs;
        return tokens.filter(t => {
          const ts = t.timestamp || 0;
          return ts >= yesterdayStart && ts < yesterdayEnd;
        });
      case '100':
      default:
        return tokens;
    }
  };

  // Calculate yesterday's graduated count from tokens
  const calculateYesterdayStats = (tokens: GraduatedToken[], apiHasMore: boolean) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayStart = now - 2 * oneDayMs; // 48h ago
    const yesterdayEnd = now - oneDayMs; // 24h ago

    const yesterdayTokens = tokens.filter(t => {
      const ts = t.timestamp || 0;
      return ts >= yesterdayStart && ts < yesterdayEnd;
    });

    const count = yesterdayTokens.length;
    const perBond = count > 0 ? (rewards.solPool / count) : 0;

    // Yesterday has more if API hit limit and oldest token is from yesterday
    const oldestToken = tokens[tokens.length - 1];
    const oldestTokenTime = oldestToken?.timestamp || 0;
    const yesterdayHasMore = apiHasMore && oldestTokenTime >= yesterdayStart;

    setGraduatedYesterday({ count, perBond, hasMore: yesterdayHasMore });
  };

  // Fetch graduated tokens (with separate refresh interval)
  useEffect(() => {
    const loadTokens = async () => {
      if (initialLoading) setTokensLoading(true);
      // Always fetch 100 to get accurate today/yesterday counts
      const { tokens, hasMore } = await fetchGraduatedTokens('100');
      setAllTokens(tokens);
      setGraduatedTokens(filterTokensByView(tokens, graduatedView));
      setTokensHasMore(hasMore);

      // Calculate today and yesterday stats
      calculateTodayStats(tokens, hasMore);
      calculateYesterdayStats(tokens, hasMore);

      if (initialLoading) setTokensLoading(false);
    };

    loadTokens();
    const interval = setInterval(loadTokens, 60000); // Only refresh tokens every minute
    return () => clearInterval(interval);
  }, [initialLoading]);

  // Update filtered tokens when view changes
  useEffect(() => {
    if (allTokens.length > 0) {
      setGraduatedTokens(filterTokensByView(allTokens, graduatedView));
    }
  }, [graduatedView, allTokens]);

  // Fetch initial data (rewards, revenue) - no auto-refresh
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      const [revenue, rewardsData] = await Promise.all([
        fetchRevenueData(),
        fetchRewardsData(),
      ]);
      setHistoricalRevenue(revenue.history);
      setRevenue24h({ fees: revenue.fees24h, volume: revenue.volume24h });
      setRewards(rewardsData);

      // Fetch yesterday stats using the SOL pool
      const yesterday = await fetchYesterdayStats(rewardsData.solPool);
      setGraduatedYesterday(yesterday);

      setInitialLoading(false);
    };

    loadInitialData();
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now;
      
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="dashboard loading">
        <div className="spinner"></div>
        <p>Loading BONKfun Stats...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1><Flame className="icon-orange" /> BONKfun Stats</h1>
        <p>Combined dashboard for BONK.fun ecosystem metrics</p>
        <div className="header-links">
          <a href="https://bonk.fun" target="_blank" rel="noopener noreferrer">
            bonk.fun <ExternalLink size={14} />
          </a>
          <a href="https://rewards.bonk.fun" target="_blank" rel="noopener noreferrer">
            rewards <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Top Stats Row */}
      <div className="stats-grid">
        {/* Rewards Pool */}
        <div className="stat-card rewards-card">
          <div className="card-header">
            <Trophy className="icon-yellow" />
            <h2>Today's Reward Pool</h2>
          </div>
          <div className="reward-amounts">
            <div className="reward-item">
              <span className="amount">{rewards.solPool.toFixed(2)}</span>
              <span className="label">SOL</span>
            </div>
            <div className="reward-item">
              <span className="amount">{rewards.usd1Pool.toFixed(2)}</span>
              <span className="label">USD1</span>
            </div>
          </div>
          <div className="countdown">
            <Clock className="icon-small" />
            <span>Next: {String(countdown.h).padStart(2, '0')}h {String(countdown.m).padStart(2, '0')}m {String(countdown.s).padStart(2, '0')}s</span>
          </div>
        </div>

        {/* 24h Revenue */}
        <div className="stat-card revenue-card">
          <div className="card-header">
            <DollarSign className="icon-green" />
            <h2>24h Revenue</h2>
          </div>
          <div className="revenue-stats">
            <div className="revenue-item">
              <span className="amount">${revenue24h.fees.toLocaleString()}</span>
              <span className="label">Fees</span>
            </div>
            <div className="revenue-item">
              <span className="amount">${(revenue24h.volume / 1000000).toFixed(2)}M</span>
              <span className="label">Volume</span>
            </div>
          </div>
        </div>

        {/* Graduated Today */}
        <div className="stat-card graduated-card">
          <div className="card-header">
            <TrendingUp className="icon-blue" />
            <h2>Graduated Today</h2>
            <span className="utc-badge" title="Since 00:00 UTC">00:00 UTC</span>
          </div>
          <div className="graduated-count">
            {graduatedToday.count}
            {graduatedToday.hasMore && <span className="count-suffix">+</span>}
          </div>
          <div className="per-bond">
            {graduatedToday.count > 0 ? `${(rewards.solPool / graduatedToday.count).toFixed(4)} SOL/bond` : '—'}
            {graduatedToday.hasMore && <span className="limit-note" title="API limit: 100 max. Actual count may be higher.">*</span>}
          </div>
          {graduatedToday.hasMore && (
            <div className="limit-warning">
              <Info size={12} /> API limited to 100. Actual may be higher.
            </div>
          )}
        </div>

        {/* Graduated Yesterday */}
        <div className="stat-card graduated-card yesterday">
          <div className="card-header">
            <TrendingUp className="icon-blue" />
            <h2>Graduated Yesterday</h2>
            <span className="utc-badge" title="00:00-23:59 UTC">Prev 24h</span>
          </div>
          <div className="graduated-count">
            {graduatedYesterday.count}
            {graduatedYesterday.hasMore && <span className="count-suffix">+</span>}
          </div>
          <div className="per-bond">
            {graduatedYesterday.perBond > 0 ? `${graduatedYesterday.perBond.toFixed(4)} SOL/bond` : '—'}
            {graduatedYesterday.hasMore && <span className="limit-note" title="API limit: 100 max. Yesterday count may be incomplete.">*</span>}
          </div>
          {graduatedYesterday.hasMore && (
            <div className="limit-warning">
              <Info size={12} /> API limited to 100. Count incomplete.
            </div>
          )}
          {!graduatedYesterday.hasMore && graduatedYesterday.count === 0 && graduatedToday.hasMore && (
            <div className="limit-warning unknown">
              <Info size={12} /> Unknown — today has 100+ graduates
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Graduated Tokens */}
        <div className="section graduated-section">
          <div className="section-header">
            <h2>Graduated Tokens</h2>
            <div className="toggle-group four-buttons">
              <button
                className={graduatedView === 'today' ? 'active' : ''}
                onClick={() => {
                  if (graduatedView !== 'today') {
                    setGraduatedView('today');
                  }
                }}
                disabled={tokensLoading}
              >
                Today
              </button>
              <button
                className={graduatedView === '24h' ? 'active' : ''}
                onClick={() => {
                  if (graduatedView !== '24h') {
                    setGraduatedView('24h');
                  }
                }}
                disabled={tokensLoading}
              >
                24h
              </button>
              <button
                className={graduatedView === 'yesterday' ? 'active' : ''}
                onClick={() => {
                  if (graduatedView !== 'yesterday') {
                    setGraduatedView('yesterday');
                  }
                }}
                disabled={tokensLoading}
              >
                Yesterday
              </button>
              <button
                className={graduatedView === '100' ? 'active' : ''}
                onClick={() => {
                  if (graduatedView !== '100') {
                    setGraduatedView('100');
                  }
                }}
                disabled={tokensLoading}
              >
                Top 100
              </button>
            </div>
          </div>
          <div className="tokens-table">
            <div className="table-header">
              <span>
                Token
                {graduatedView === 'today' && graduatedToday.hasMore && (
                  <span className="header-note"> ({graduatedToday.count}+)</span>
                )}
                {graduatedView === 'yesterday' && graduatedYesterday.hasMore && (
                  <span className="header-note"> ({graduatedYesterday.count}+)</span>
                )}
                {graduatedView === '100' && tokensHasMore && (
                  <span className="header-note" title="Showing 100 of 100+ tokens"> (100+)</span>
                )}
              </span>
              <span>Market Cap</span>
              <span>24h Volume</span>
              <span>Date</span>
            </div>
            {tokensLoading ? (
              <div className="tokens-loading">
                <div className="spinner-small"></div>
                <span>Loading tokens...</span>
              </div>
            ) : (
              graduatedTokens.map((token) => (
                <div key={token.id} className="token-row">
                  <div className="token-info">
                    <div className="token-image-container">
                      {token.imageUrl ? (
                        <img 
                          src={token.imageUrl} 
                          alt="" 
                          className="token-image" 
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="token-image-placeholder" 
                        style={{ display: token.imageUrl ? 'none' : 'flex' }}
                      >
                        <span className="token-initial">{token.name.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="token-details">
                      <span className="token-name">{token.name}</span>
                      <span className="token-symbol">${token.symbol}</span>
                    </div>
                  </div>
                  <span className="market-cap">${(token.marketCap / 1000).toFixed(1)}k</span>
                  <span className="volume">${(token.volume24h / 1000).toFixed(1)}k</span>
                  <span className="token-date">
                    {new Date(token.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(token.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historical Revenue */}
        <div className="section chart-section">
          <div className="section-header">
            <Wallet className="icon-purple" />
            <h2>Revenue History (30d)</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={historicalRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #2a2a3a' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Fees']}
                />
                <Bar dataKey="fees" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-container second-chart">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #2a2a3a' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>Data sources: bonk.fun, rewards.bonk.fun</p>
        <p>Updates automatically every 60 seconds</p>
        <p className="utc-note"><Info size={12} /> "Today" = since 00:00 UTC | "Yesterday" = 00:00-23:59 UTC previous day</p>
      </footer>
    </div>
  );
}

export default App;
