import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Heart, ArrowRight, Clock } from 'lucide-react';
import './index.css';

// API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://market-backend-oozv.onrender.com/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  discountRate?: number;
  imageUrl: string;
  sourceUrl: string;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      
      const res = await axios.get(`${API_BASE_URL}/products`, { params });
      // Sort products to show highest discount first
      const sorted = res.data.sort((a: any, b: any) => (b.discountRate || 0) - (a.discountRate || 0));
      setProducts(sorted);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
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
            <button style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={20} />
              <span className="hide-mobile">Favoriler</span>
            </button>
            <button className="btn-primary">Giriş Yap</button>
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
          <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Clock size={16} /> Otomatik Güncelleniyor
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
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'var(--surface-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        border: '1px solid var(--surface-border)'
                      }}
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
