import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trophy, DollarSign, Clock, TrendingUp, Wallet, Flame } from 'lucide-react';
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
}

interface RevenueData {
  totalRevenue: number;
  fees24h: number;
  volume24h: number;
  distribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

interface RewardsData {
  solPool: number;
  usd1Pool: number;
  graduatedToday: number;
  perBond: number;
  nextDistribution: number;
}

// Mock data generators (replace with actual API calls)
const generateMockGraduated = (timeRange: '100' | '24h'): GraduatedToken[] => {
  const count = timeRange === '24h' ? 15 : 100;
  return Array.from({ length: count }, (_, i) => ({
    id: `token-${i}`,
    name: `Token ${i + 1}`,
    symbol: `TKN${i + 1}`,
    marketCap: Math.random() * 1000000 + 50000,
    volume24h: Math.random() * 500000 + 10000,
    priceChange24h: (Math.random() - 0.5) * 100,
    timestamp: Date.now() - Math.random() * (timeRange === '24h' ? 86400000 : 604800000),
  }));
};

const REVENUE_DISTRIBUTION = [
  { name: 'Buy for BNKK', value: 51, color: '#f97316' },
  { name: 'Community Marketing', value: 10, color: '#3b82f6' },
  { name: 'BONKsol Staking', value: 10, color: '#22c55e' },
  { name: '$GP Reserve', value: 7.67, color: '#a855f7' },
  { name: 'Hiring/Growth', value: 7.67, color: '#ec4899' },
  { name: 'Development', value: 7.67, color: '#06b6d4' },
  { name: 'Marketing', value: 4, color: '#eab308' },
  { name: 'BonkRewards', value: 2, color: '#6366f1' },
];

function App() {
  const [graduatedView, setGraduatedView] = useState<'100' | '24h'>('24h');
  const [graduatedTokens, setGraduatedTokens] = useState<GraduatedToken[]>([]);
  const [rewards, setRewards] = useState<RewardsData>({
    solPool: 0,
    usd1Pool: 0,
    graduatedToday: 0,
    perBond: 0,
    nextDistribution: 0,
  });
  const [revenue] = useState<RevenueData>({
    totalRevenue: 1250000,
    fees24h: 45000,
    volume24h: 2500000,
    distribution: REVENUE_DISTRIBUTION,
  });
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });

  // Fetch graduated tokens
  useEffect(() => {
    // TODO: Replace with actual API call to bonk.fun
    setGraduatedTokens(generateMockGraduated(graduatedView));
  }, [graduatedView]);

  // Fetch rewards data
  useEffect(() => {
    // TODO: Replace with actual API call to rewards.bonk.fun
    setRewards({
      solPool: 12.5,
      usd1Pool: 1250,
      graduatedToday: 8,
      perBond: 0.15,
      nextDistribution: Date.now() + 3600000, // 1 hour from now
    });
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1><Flame className="icon-orange" /> BONKfun Stats</h1>
        <p>Combined dashboard for BONK.fun ecosystem metrics</p>
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
              <span className="amount">${revenue.fees24h.toLocaleString()}</span>
              <span className="label">Fees</span>
            </div>
            <div className="revenue-item">
              <span className="amount">${revenue.volume24h.toLocaleString()}</span>
              <span className="label">Volume</span>
            </div>
          </div>
        </div>

        {/* Graduated Today */}
        <div className="stat-card graduated-card">
          <div className="card-header">
            <TrendingUp className="icon-blue" />
            <h2>Graduated Today</h2>
          </div>
          <div className="graduated-count">{rewards.graduatedToday}</div>
          <div className="per-bond">{rewards.perBond > 0 ? `${rewards.perBond} SOL/bond` : '—'}</div>
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
                  <span className="token-name">{token.name}</span>
                  <span className="token-symbol">{token.symbol}</span>
                </div>
                <span className="market-cap">${token.marketCap.toLocaleString()}</span>
                <span className="volume">${token.volume24h.toLocaleString()}</span>
                <span className={`change ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="section chart-section">
          <div className="section-header">
            <Wallet className="icon-purple" />
            <h2>Revenue Distribution</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenue.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revenue.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="distribution-list">
            {revenue.distribution.map((item) => (
              <div key={item.name} className="distribution-item">
                <span className="dot" style={{ backgroundColor: item.color }}></span>
                <span className="name">{item.name}</span>
                <span className="value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>Data sources: bonk.fun, revenue.letsbonk.fun, rewards.bonk.fun</p>
        <p>Updates automatically every 60 seconds</p>
      </footer>
    </div>
  );
}

export default App;
