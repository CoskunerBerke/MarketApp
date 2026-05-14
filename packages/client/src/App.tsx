import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Heart, ArrowRight, Clock, X, User, LogOut } from 'lucide-react';
import './index.css';

// API URL configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://market-backend-oozv.onrender.com/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  discountRate?: number;
  imageUrl: string;
  sourceUrl: string;
}

interface UserData {
  _id: string;
  email: string;
  token: string;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('marketUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchProducts();
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      
      const res = await axios.get(`${API_BASE_URL}/products`, { params });
      const sorted = res.data.sort((a: any, b: any) => (b.discountRate || 0) - (a.discountRate || 0));
      setProducts(sorted);
      
      if (res.data.length > 0) {
        const latest = res.data.reduce((prev: any, current: any) => {
          return (new Date(prev.updatedAt) > new Date(current.updatedAt)) ? prev : current;
        });
        setLastUpdated(new Date(latest.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFavorites(res.data.map((f: any) => f.product._id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, { email, password });
      localStorage.setItem('marketUser', JSON.stringify(res.data));
      setUser(res.data);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Bir hata oluştu.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('marketUser');
    setUser(null);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/favorites`, 
        { productId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      if (res.data.action === 'added') {
        setFavorites([...favorites, productId]);
      } else {
        setFavorites(favorites.filter(id => id !== productId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-fade">
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>
              <X size={24} />
            </button>
            <h2>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Favorilerinizi kaydetmek için oturum açın.
            </p>
            {authError && <div className="auth-error">{authError}</div>}
            <form onSubmit={handleAuth}>
              <input 
                type="email" 
                placeholder="E-posta" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Şifre" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              {authMode === 'login' ? (
                <span>Hesabınız yok mu? <a href="#" onClick={() => setAuthMode('register')}>Kayıt Ol</a></span>
              ) : (
                <span>Zaten hesabınız var mı? <a href="#" onClick={() => setAuthMode('login')}>Giriş Yap</a></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo-area">
            <div className="logo-box">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png" alt="BİM" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              Market<span style={{ color: 'var(--primary)' }}>Fırsatları</span>
            </span>
          </div>

          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="BİM ürünlerinde ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {user ? (
              <div className="user-profile">
                <div className="user-info hide-mobile">
                  <User size={18} />
                  <span>{user.email.split('@')[0]}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Çıkış Yap">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setShowAuthModal(true)}>Giriş Yap</button>
            )}
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingBottom: '5rem' }}>
        {/* Hero Section */}
        <section className="hero animate-fade">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero" 
            className="hero-img"
          />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="badge">Aktif Kampanyalar</span>
            </div>
            <h1>BİM Fırsatlarını<br />Anlık Takip Edin.</h1>
            <p>En güncel aktüel ürünler ve indirimli fiyatlar tek bir platformda. Cebinize dost alışverişin adresi.</p>
            <button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              İndirimleri İncele <ArrowRight size={22} />
            </button>
          </div>
        </section>

        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>BİM İndirim Kataloğu</h2>
            <p style={{ color: 'var(--text-muted)' }}>Şu an yayında olan tüm fırsat ürünleri</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Clock size={16} /> Otomatik Güncelleniyor
            </div>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Son Güncelleme: {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="glass" style={{ height: '380px', opacity: 0.5 }}></div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product._id} className="glass product-card">
                <button 
                  className={`fav-btn ${favorites.includes(product._id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(product._id)}
                >
                  <Heart size={20} fill={favorites.includes(product._id) ? "var(--primary)" : "none"} />
                </button>
                <div className="card-image-box">
                  <img src={product.imageUrl} alt={product.name} />
                  {product.discountRate && product.discountRate > 0 && (
                    <div className="discount-badge">%{product.discountRate}</div>
                  )}
                </div>
                <div className="card-info">
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>BİM Aktüel</span>
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="price-row">
                    <div className="price-box">
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="old-price">₺{product.oldPrice.toFixed(2)}</span>
                      )}
                      <span className="current-price">₺{product.price.toFixed(2)}</span>
                    </div>
                    <a 
                      href={product.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-btn"
                    >
                      <ArrowRight size={20} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="glass" style={{ padding: '10rem 0', textAlign: 'center' }}>
            <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
            <h3>Henüz ürün bulunamadı.</h3>
            <p style={{ color: 'var(--text-muted)' }}>Admin panelinden verileri güncelleyebilirsiniz.</p>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--surface-border)', padding: '5rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
           <div className="logo-area" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="logo-box">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png" alt="BİM" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              Market<span style={{ color: 'var(--primary)' }}>Fırsatları</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Türkiye'nin en sevilen market indirimlerini tek bir çatı altında toplayan akıllı alışveriş yardımcınız.
          </p>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            © 2026 MarketFırsatları. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
