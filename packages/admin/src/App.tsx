import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

const api = axios.create({ baseURL: 'https://market-backend-oozv.onrender.com/api' });

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <ShoppingCart color="var(--primary-blue)" size={28} />
        MarketAdmin
      </div>
      <div className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/products" className={`nav-item ${isActive('/products')}`}>
          <ShoppingCart size={20} /> Ürünler
        </Link>
        <Link to="/categories" className={`nav-item ${isActive('/categories')}`}>
          <LayoutDashboard size={20} /> Kategoriler
        </Link>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ markets: 0, products: 0, discounts: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [marketsRes, productsRes] = await Promise.all([
        api.get('/markets'),
        api.get('/products')
      ]);
      
      setProducts(productsRes.data); // Show all
      setStats({
        markets: marketsRes.data.length,
        products: productsRes.data.length,
        discounts: productsRes.data.filter((p: any) => p.discountRate > 0).length
      });
    } catch (error) {
      console.error("Dashboard veri çekme hatası:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      await api.post('/scrape/a101');
      alert('BİM verilerini çekme işlemi başlatıldı! Birkaç dakika içinde ürünler listelenecektir.');
      setTimeout(fetchDashboardData, 5000); // Refresh after 5s
    } catch (error) {
      alert('Hata oluştu!');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Dashboard Özeti</h2>
        <button 
          onClick={handleScrape}
          disabled={isScraping}
          style={{ 
            background: 'var(--primary-blue)', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '8px',
            opacity: isScraping ? 0.7 : 1,
            cursor: isScraping ? 'not-allowed' : 'pointer'
          }}
        >
          {isScraping ? 'Veriler Çekiliyor...' : 'BİM Verilerini Güncelle'}
        </button>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Store size={24} />
          </div>
          <div className="stat-info">
            <h3>Toplam Market</h3>
            <p>{stats.markets}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <h3>Aktif Ürünler</h3>
            <p>{stats.products}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon danger">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <h3>İndirimli Ürünler</h3>
            <p>{stats.discounts}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Ürün Adı</th>
              <th>Fiyat</th>
              <th>İndirim</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>{p.marketId?.name}</td>
                <td>{p.name}</td>
                <td>{p.price} ₺</td>
                <td>
                  {p.discountRate ? (
                    <span className="badge badge-danger">%{p.discountRate}</span>
                  ) : '-'}
                </td>
                <td><span className="badge badge-success">Aktif</span></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5}>Henüz ürün yok. Scraping servisini tetikleyin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<h2>Market Yönetimi</h2>} />
            <Route path="/products" element={<h2>Ürün Yönetimi</h2>} />
            <Route path="/users" element={<h2>Kullanıcı Yönetimi</h2>} />
            <Route path="/settings" element={<h2>Ayarlar</h2>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
