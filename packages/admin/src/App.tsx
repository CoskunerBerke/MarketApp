import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Store, RefreshCw, Trash2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
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
  const [stats, setStats] = useState({ total: 0, bim: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/products');
      // Filter for BİM only as requested
      const bimProducts = data.filter((p: any) => p.marketId?.name === 'BİM');
      setProducts(bimProducts);
      setStats({ total: bimProducts.length, bim: bimProducts.length });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScrape = async (market: string) => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post(`/scrape/${market.toLowerCase()}`);
      setMessage({ text: `${market} tarama işlemi başlatıldı! Veriler birazdan güncellenecektir.`, type: 'success' });
      setTimeout(fetchData, 8000); // Give it more time for 90 products
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
            <RefreshCw size={18} className={loading ? 'spinner' : ''} /> BİM Verilerini Güncelle
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
        <StatCard icon={ShoppingCart} title="Toplam İndirimli Ürün" value={stats.total} color="var(--primary)" />
        <StatCard icon={Store} title="Aktif Market" value="BİM" color="var(--accent-blue)" />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tüm BİM İndirimleri ({products.length} Ürün)</h2>
          <button className="btn btn-outline" onClick={fetchData}>Yenile</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Market</th>
                <th>Fiyat</th>
                <th>İndirim</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={product.imageUrl} alt="" className="product-img" />
                      <span style={{ fontWeight: 500 }}>{product.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">BİM</span>
                  </td>
                  <td>
                    <div className="price-box">
                      <span className="old-price">₺{product.oldPrice?.toFixed(2)}</span>
                      <span className="new-price">₺{product.price?.toFixed(2)}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>%{product.discountRate}</span>
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
