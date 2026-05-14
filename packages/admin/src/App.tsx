import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Store, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

const api = axios.create({ 
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://market-backend-oozv.onrender.com/api' 
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
  const [selectedMarket, setSelectedMarket] = useState<'BİM' | 'ŞOK'>('BİM');
  const [stats, setStats] = useState({ total: 0, bim: 0, sok: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/products');
      setAllProducts(data);
      const bimCount = data.filter((p: any) => p.marketId?.name === 'BİM').length;
      const sokCount = data.filter((p: any) => p.marketId?.name === 'ŞOK').length;
      setStats({ total: data.length, bim: bimCount, sok: sokCount });
      
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

const Sidebar = () => {
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
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Versiyon 2.0.0</p>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Premium Pro</p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="admin-layout">
        <Sidebar />
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
