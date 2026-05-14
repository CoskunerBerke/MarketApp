import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingBag, Search, Tag, ExternalLink, Zap, Info } from 'lucide-react';
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
  }, []);

  useEffect(() => {
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  return (
    <div className="app">
      <div className="bg-glow"></div>
      
      <nav className="navbar">
        <div className="container nav-content">
          <a href="/" className="logo">
            <ShoppingBag size={32} color="var(--primary)" />
            <span>MarketFırsat</span>
          </a>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Zap size={16} fill="var(--accent-orange)" color="var(--accent-orange)" />
             Canlı Veri
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
               <span style={{ background: 'var(--border)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.875rem' }}>
                 {filteredProducts.length} Ürün Bulundu
               </span>
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
