import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Store, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Mail, Lock, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

// Force redeploy - Final check for market tabs and scrape buttons

const api = axios.create({ 
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://market-backend-oozv.onrender.com/api' 
});

// Axios JWT Request & Response Interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Direct page reload to force showing the login screen
    window.location.reload();
  }
  return Promise.reject(error);
});

// Components
const StatCard = ({ icon: Icon, title, value, color }: any) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
      <Icon size={24} />
    </div>
    <div className="stat-info">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<'BİM' | 'ŞOK' | 'Migros'>('BİM');
  const [stats, setStats] = useState({ total: 0, bim: 0, sok: 0, migros: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/products');
      setAllProducts(data);
      const bimCount = data.filter((p: any) => p.marketId?.name === 'BİM').length;
      const sokCount = data.filter((p: any) => p.marketId?.name === 'ŞOK').length;
      const migrosCount = data.filter((p: any) => p.marketId?.name === 'Migros').length;
      setStats({ total: data.length, bim: bimCount, sok: sokCount, migros: migrosCount });
      
      const filtered = data.filter((p: any) => p.marketId?.name === selectedMarket);
      setProducts(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const filtered = allProducts.filter((p: any) => p.marketId?.name === selectedMarket);
    setProducts(filtered);
  }, [selectedMarket, allProducts]);

  useEffect(() => { fetchData(); }, []);

  const handleScrape = async (market: string) => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post(`/scrape/${market.toLowerCase()}`);
      setMessage({ text: `${market} tarama işlemi başlatıldı! Veriler birazdan güncellenecektir.`, type: 'success' });
      setTimeout(fetchData, 8000);
    } catch (err) {
      setMessage({ text: `${market} güncellenirken bir hata oluştu.`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div className="header">
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => handleScrape('bim')}>
            <RefreshCw size={18} className={loading ? 'spinner' : ''} /> BİM Tarat
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#EC2027', borderColor: '#EC2027' }} onClick={() => handleScrape('sok')}>
            <RefreshCw size={18} className={loading ? 'spinner' : ''} /> ŞOK Tarat
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#FF6600', borderColor: '#FF6600' }} onClick={() => handleScrape('migros')}>
            <RefreshCw size={18} className={loading ? 'spinner' : ''} /> Migros Tarat
          </button>
        </div>
      </div>

      {message && (
        <div className={`card`} style={{ 
          borderLeft: `4px solid ${message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1.5rem'
        }}>
          {message.type === 'success' ? <CheckCircle color="var(--accent-green)" /> : <AlertCircle color="var(--accent-red)" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={ShoppingCart} title="Toplam Ürün" value={stats.total} color="var(--primary)" />
        <StatCard icon={Store} title="BİM Ürünleri" value={stats.bim} color="var(--accent-blue)" />
        <StatCard icon={Store} title="ŞOK Ürünleri" value={stats.sok} color="#EC2027" />
        <StatCard icon={Store} title="Migros Ürünleri" value={stats.migros} color="#FF6600" />
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${selectedMarket === 'BİM' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedMarket('BİM')}
            >
              BİM Listesi
            </button>
            <button 
              className={`btn ${selectedMarket === 'ŞOK' ? 'btn-primary' : 'btn-outline'}`}
              style={selectedMarket === 'ŞOK' ? { backgroundColor: '#EC2027', borderColor: '#EC2027' } : {}}
              onClick={() => setSelectedMarket('ŞOK')}
            >
              ŞOK Listesi
            </button>
            <button 
              className={`btn ${selectedMarket === 'Migros' ? 'btn-primary' : 'btn-outline'}`}
              style={selectedMarket === 'Migros' ? { backgroundColor: '#FF6600', borderColor: '#FF6600' } : {}}
              onClick={() => setSelectedMarket('Migros')}
            >
              Migros Listesi
            </button>
          </div>
          <button className="btn btn-outline" onClick={fetchData}>Yenile</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Fiyat</th>
                <th>İndirim/Kampanya</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={product.imageUrl} alt="" className="product-img" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.marketId?.name} İNDİRİM</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="price-box">
                      {product.promotionPrice ? (
                        <>
                          <span className="old-price">₺{product.price?.toFixed(2)}</span>
                          <span className="new-price" style={{ color: '#EC2027' }}>₺{product.promotionPrice?.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="old-price">₺{product.oldPrice?.toFixed(2)}</span>
                          <span className="new-price">₺{product.price?.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    {product.promotionText ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(236, 32, 39, 0.1)', color: '#EC2027', fontSize: '0.7rem' }}>
                        {product.promotionText}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>%{product.discountRate || 0}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem' }}>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar">
      <div className="logo">
        <ShoppingCart size={28} />
        <span>Market Admin</span>
      </div>
      <nav className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/products" className={`nav-link ${isActive('/products')}`}>
          <ShoppingCart size={20} /> Ürün Yönetimi
        </Link>
        <Link to="/markets" className={`nav-link ${isActive('/markets')}`}>
          <Store size={20} /> Marketler
        </Link>
        <button 
          onClick={onLogout} 
          className="nav-link" 
          style={{ 
            width: '100%', 
            background: 'none', 
            border: 'none', 
            textAlign: 'left', 
            cursor: 'pointer', 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center',
            color: 'var(--accent-red)',
            padding: '1rem'
          }}
        >
          <LogOut size={20} /> Çıkış Yap
        </button>
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Versiyon 2.0.0</p>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Premium Pro</p>
      </div>
    </div>
  );
};

const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.role !== 'admin') {
        setError('Bu panele sadece yöneticiler giriş yapabilir.');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return (
      <div className="login-layout" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#0a0a0c', color: 'white', fontFamily: 'Inter, sans-serif'
      }}>
        <div className="bg-glow" style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }}></div>
        <div className="card animate-up" style={{
          maxWidth: '400px', width: '100%', padding: '2.5rem', background: '#13131a',
          borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              color: 'var(--primary)'
            }}>
              <ShoppingCart size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Market Yönetimi</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Lütfen yönetici hesabı ile giriş yapın.</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444',
              color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.875rem', marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="email"
                placeholder="Yönetici E-postası"
                className="search-input"
                style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                placeholder="Şifre"
                className="search-input"
                style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.85rem', width: '100%', justifyContent: 'center', fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="admin-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Dashboard />} />
            <Route path="/markets" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
