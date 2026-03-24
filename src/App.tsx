/**
 * ⚠️ MOCK DATA WARNING ⚠️
 * 
 * This dashboard uses FAKE/MOCK DATA for demonstration purposes.
 * All token names, prices, and metrics are placeholder examples.
 * 
 * TO USE REAL DATA:
 * 1. Find actual API endpoints using browser DevTools on bonk.fun
 * 2. Replace mock fetch functions below with real API calls
 * 3. Handle CORS (use proxy or Netlify Functions)
 * 
 * Current implementation returns static mock data only.
 */

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

// Fetch graduated tokens from bonk.fun API
const fetchGraduatedTokens = async (timeRange: '100' | '24h'): Promise<GraduatedToken[]> => {
  try {
    // Note: This is a mock implementation. 
    // Real implementation would need CORS proxy or backend endpoint
    // const response = await fetch('https://api.bonk.fun/graduated?limit=' + (timeRange === '24h' ? '50' : '100'));
    // const data = await response.json();
    
    // Mock data with realistic token names
    const mockTokens: GraduatedToken[] = [
      { id: '1', name: 'BonkMoon', symbol: 'BMOON', marketCap: 2500000, volume24h: 450000, priceChange24h: 45.2, timestamp: Date.now() - 3600000, imageUrl: '' },
      { id: '2', name: 'SolanaDoge', symbol: 'SDOGE', marketCap: 1800000, volume24h: 320000, priceChange24h: -12.5, timestamp: Date.now() - 7200000, imageUrl: '' },
      { id: '3', name: 'MemeCoinMax', symbol: 'MAX', marketCap: 950000, volume24h: 280000, priceChange24h: 89.3, timestamp: Date.now() - 10800000, imageUrl: '' },
      { id: '4', name: 'RocketBONK', symbol: 'RBONK', marketCap: 750000, volume24h: 150000, priceChange24h: 23.7, timestamp: Date.now() - 14400000, imageUrl: '' },
      { id: '5', name: 'DegenLife', symbol: 'DEGEN', marketCap: 620000, volume24h: 120000, priceChange24h: -5.4, timestamp: Date.now() - 18000000, imageUrl: '' },
      { id: '6', name: 'MoonShot', symbol: 'MOON', marketCap: 580000, volume24h: 98000, priceChange24h: 156.2, timestamp: Date.now() - 21600000, imageUrl: '' },
      { id: '7', name: 'BONKArmy', symbol: 'ARMY', marketCap: 450000, volume24h: 87000, priceChange24h: 34.8, timestamp: Date.now() - 25200000, imageUrl: '' },
      { id: '8', name: 'SolSurfer', symbol: 'SURF', marketCap: 380000, volume24h: 65000, priceChange24h: -18.9, timestamp: Date.now() - 28800000, imageUrl: '' },
    ];
    
    return timeRange === '24h' ? mockTokens.slice(0, 8) : [...mockTokens, ...mockTokens.map((t, i) => ({...t, id: t.id + '-' + i, name: t.name + ' V' + (i+2)}))];
  } catch (error) {
    console.error('Error fetching graduated tokens:', error);
    return [];
  }
};

// Fetch historical revenue data
const fetchHistoricalRevenue = async (): Promise<HistoricalRevenue[]> => {
  // Mock historical data - last 30 days
  const data: HistoricalRevenue[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fees: Math.floor(Math.random() * 30000) + 20000,
      volume: Math.floor(Math.random() * 2000000) + 1000000,
    });
  }
  return data;
};

// Fetch rewards data
const fetchRewardsData = async (): Promise<RewardsData> => {
  // Mock data - replace with actual API call
  return {
    solPool: 12.5,
    usd1Pool: 1250,
    graduatedToday: 8,
    perBond: 0.15,
    nextDistribution: Date.now() + 3600000,
  };
};

function App() {
  const [graduatedView, setGraduatedView] = useState<'100' | '24h'>('24h');
  const [graduatedTokens, setGraduatedTokens] = useState<GraduatedToken[]>([]);
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
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [tokens, revenue, rewardsData] = await Promise.all([
        fetchGraduatedTokens(graduatedView),
        fetchHistoricalRevenue(),
        fetchRewardsData(),
      ]);
      setGraduatedTokens(tokens);
      setHistoricalRevenue(revenue);
      setRewards(rewardsData);
      
      // Calculate 24h totals from historical data
      const last24h = revenue.slice(-1)[0];
      if (last24h) {
        setRevenue24h({ fees: last24h.fees, volume: last24h.volume });
      }
      
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [graduatedView]);

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

  if (loading) {
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
          <div className="graduated-count">{rewards.graduatedToday}</div>
          <div className="per-bond">{rewards.perBond > 0 ? `${rewards.perBond} SOL/bond` : '—'}</div>
        </div>

        {/* Graduated Yesterday */}
        <div className="stat-card graduated-card yesterday">
          <div className="card-header">
            <TrendingUp className="icon-blue" />
            <h2>Graduated Yesterday</h2>
            <span className="utc-badge" title="00:00-23:59 UTC">Prev 24h</span>
          </div>
          <div className="graduated-count">{rewards.graduatedToday + 3}</div>
          <div className="per-bond">0.12 SOL/bond</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Graduated Tokens */}
        <div className="section graduated-section">
          <div className="section-header">
            <h2>Graduated Tokens</h2>
            <div className="toggle-group">
              <button 
                className={graduatedView === '24h' ? 'active' : ''}
                onClick={() => setGraduatedView('24h')}
              >
                Last 24h
              </button>
              <button 
                className={graduatedView === '100' ? 'active' : ''}
                onClick={() => setGraduatedView('100')}
              >
                Top 100
              </button>
            </div>
          </div>
          <div className="tokens-table">
            <div className="table-header">
              <span>Token</span>
              <span>Market Cap</span>
              <span>24h Volume</span>
              <span>24h Change</span>
            </div>
            {graduatedTokens.map((token) => (
              <div key={token.id} className="token-row">
                <div className="token-info">
                  {token.imageUrl && <img src={token.imageUrl} alt="" className="token-image" />}
                  <div className="token-details">
                    <span className="token-name">{token.name}</span>
                    <span className="token-symbol">${token.symbol}</span>
                  </div>
                </div>
                <span className="market-cap">${(token.marketCap / 1000).toFixed(1)}k</span>
                <span className="volume">${(token.volume24h / 1000).toFixed(1)}k</span>
                <span className={`change ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                </span>
              </div>
            ))}
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
