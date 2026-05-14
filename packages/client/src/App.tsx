import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingBag, Search, Tag, ExternalLink, Zap, Info, User, LogOut, X, Heart, Mail, Lock } from 'lucide-react';
import './index.css';

const api = axios.create({ 
  baseURL: 'https://market-backend-oozv.onrender.com/api' 
});

interface Product {
  _id: string;
  name: string;
  price: number;
  oldPrice: number;
  discountRate: number;
  imageUrl: string;
  sourceUrl: string;
  marketId: {
    name: string;
    logoUrl: string;
  };
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth & Favorites States
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Veri çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFavorites(parsedUser.favorites || []);
    }
  }, []);

  useEffect(() => {
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { email, password });
      
      // Backend returns fields directly (data._id, data.email, etc.)
      const userData = {
        id: data._id,
        email: data.email,
        role: data.role,
        favorites: data.favorites || []
      };
      
      setUser(userData);
      setFavorites(userData.favorites);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
      setShowAuthModal(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'İşlem başarısız!';
      alert(errorMsg);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post(`/users/favorites/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(data.favorites);
      const updatedUser = { ...user, favorites: data.favorites };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Favori güncellenemedi');
    }
  };

  return (
    <div className="app">
      <div className="bg-glow"></div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="loading-overlay" style={{ padding: '1rem' }}>
          <div className="card animate-up" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
                {authMode === 'login' ? 'Tekrar Hoş Geldin' : 'Fırsatlara Katıl'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {authMode === 'login' ? 'Favorilerini görmek için giriş yap.' : 'Yeni indirimlerden ilk senin haberin olsun.'}
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="E-posta Adresi"
                  className="search-input"
                  style={{ paddingLeft: '3rem', fontSize: '0.9rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="Şifre"
                  className="search-input"
                  style={{ paddingLeft: '3rem', fontSize: '0.9rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-buy" style={{ marginTop: '1rem' }}>
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? (
                <span>Hesabınız yok mu? <button onClick={() => setAuthMode('register')} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Kayıt Ol</button></span>
              ) : (
                <span>Zaten üye misiniz? <button onClick={() => setAuthMode('login')} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Giriş Yap</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="container nav-content">
          <a href="/" className="logo">
            <ShoppingBag size={32} color="var(--primary)" />
            <span>MarketFırsat</span>
          </a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Zap size={16} fill="var(--accent-orange)" color="var(--accent-orange)" />
               Canlı Veri
            </div>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <User size={18} color="white" />
                   </div>
                   <span className="hide-mobile">{user.email.split('@')[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem' }}>
                   <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button className="btn-buy" style={{ margin: 0, padding: '0.5rem 1.25rem' }} onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        <header className="hero animate-up">
          <h1>Kaçırılmayacak İndirimler</h1>
          <p>BİM marketlerindeki en güncel ve en yüksek indirimli ürünleri senin için tek bir yerde topladık.</p>
          
          <div className="search-container">
            <Search className="search-icon" size={24} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Ürün adı ara... (Örn: Süt, Turşu, Çikolata)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card skeleton" style={{ height: '400px' }}></div>
            ))}
          </div>
        ) : (
          <section>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                 {searchTerm ? `"${searchTerm}" Sonuçları` : 'Tüm Fırsatlar'}
               </h2>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 {user && (
                   <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600 }}>
                     {favorites.length} Favori
                   </span>
                 )}
                 <span style={{ background: 'var(--border)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.875rem' }}>
                   {filteredProducts.length} Ürün
                 </span>
               </div>
            </div>

            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product._id} 
                  className="product-card animate-up" 
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="img-container">
                    <img src={product.imageUrl} alt={product.name} className="product-img" />
                    <div className="discount-badge">%{product.discountRate} İNDİRİM</div>
                    <button 
                      className={`fav-btn-elite ${favorites.includes(product._id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(product._id);
                      }}
                      style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: favorites.includes(product._id) ? 'var(--accent-red)' : 'rgba(0,0,0,0.4)',
                        border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(8px)',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Heart size={20} color="white" fill={favorites.includes(product._id) ? "white" : "none"} />
                    </button>
                  </div>
                  
                  <span className="market-badge">{product.marketId?.name} İNDİRİM</span>
                  <h3 className="product-name">{product.name}</h3>
                  
                  <div className="price-section">
                    <div className="price-box">
                      <span className="old-price">₺{product.oldPrice?.toFixed(2)}</span>
                      <div className="new-price">₺{product.price?.toFixed(2)}</div>
                    </div>
                    <div style={{ color: 'var(--accent-orange)' }}>
                      <Tag size={20} />
                    </div>
                  </div>
                  
                  <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="btn-buy">
                    Fırsatı Gör <ExternalLink size={18} />
                  </a>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Aradığın kriterlere uygun ürün bulunamadı.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '4rem 0', borderTop: '1px solid var(--border)', marginTop: '4rem', color: 'var(--text-muted)' }}>
        <p>© 2026 MarketFırsat. Tüm hakları saklıdır.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>İndirim oranları ve fiyatlar BİM resmi web sitesinden alınmaktadır.</p>
      </footer>
    </div>
  );
}

export default App;
