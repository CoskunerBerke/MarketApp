import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Heart, Menu, X, ArrowRight, Tag, Clock } from 'lucide-react';
import type { Product, Market } from './types';

// API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://market-backend-oozv.onrender.com/api';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      
      const res = await axios.get(`${API_BASE_URL}/products`, { params });
      // Sort products to show newest/highest discount first
      const sorted = res.data.sort((a: any, b: any) => (b.discountRate || 0) - (a.discountRate || 0));
      setProducts(sorted);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">Market<span className="text-primary">Fırsatları</span></span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              type="text" 
              placeholder="BİM ürünlerinde ara..." 
              className="w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button className="text-text-muted hover:text-white flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Favoriler
            </button>
            <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-medium">
              Giriş Yap
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="pt-28 pb-20">
        <div className="container">
          {/* Hero Section */}
          <section className="relative rounded-3xl overflow-hidden mb-16 animate-fade-in" style={{ height: '450px' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-bg-color via-bg-color/60 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop" 
              alt="Hero" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png" alt="Bim" className="h-8 brightness-0 invert" />
                 <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1 rounded-full text-xs font-bold">GÜNCEL İNDİRİMLER</span>
              </div>
              <h1 className="text-6xl font-bold mb-6 leading-tight tracking-tight">BİM Fırsatlarını <br />Kaçırmayın.</h1>
              <p className="text-xl text-text-muted mb-10 leading-relaxed">05 Mayıs - 02 Haziran ve 09-15 Mayıs tarihlerine özel tüm indirimli ürünleri anlık olarak takip edin.</p>
              <div className="flex gap-4">
                <button className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  Ürünleri İncele <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </section>

          {/* Product Grid */}
          <div>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">BİM İndirim Kataloğu</h2>
                <p className="text-text-muted">Şu an aktif olan tüm kampanyalı ürünler</p>
              </div>
              <div className="flex items-center gap-2 text-text-muted bg-surface-color px-4 py-2 rounded-xl border border-surface-border">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Otomatik Güncelleniyor</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="glass h-96 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="glass group overflow-hidden transition-all hover:translate-y-[-8px] hover:border-primary/50">
                    <div className="relative aspect-square bg-white p-6 flex items-center justify-center m-3 rounded-2xl">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/300'} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                      {product.discountRate > 0 && (
                        <div className="absolute top-0 left-0 bg-accent text-white px-3 py-1.5 rounded-br-2xl rounded-tl-xl text-sm font-bold flex items-center gap-1 shadow-lg">
                          <Tag className="w-4 h-4" />
                          %{product.discountRate}
                        </div>
                      )}
                      <button className="absolute bottom-3 right-3 p-3 rounded-xl bg-bg-color/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary">
                        <Heart className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-[11px] uppercase font-bold text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                           BİM AKTÜEL
                         </span>
                      </div>
                      <h3 className="font-semibold text-base line-clamp-2 mb-6 h-12 leading-snug group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.oldPrice && product.oldPrice > product.price && (
                            <span className="text-sm text-text-muted line-through mb-1">₺{product.oldPrice.toFixed(2)}</span>
                          )}
                          <span className="text-2xl font-bold text-white tracking-tight">₺{product.price.toFixed(2)}</span>
                        </div>
                        <a 
                          href={product.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-surface-color border border-surface-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && products.length === 0 && (
              <div className="text-center py-32 glass">
                <div className="w-20 h-20 bg-surface-color rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-text-muted" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ürün Bulunamadı</h3>
                <p className="text-text-muted">Şu an için BİM sisteminde aktif kampanya bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-border pt-20 pb-10 bg-bg-color">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white p-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Bim_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Market<span className="text-primary">Fırsatları</span></span>
              </div>
              <p className="text-text-muted text-lg max-w-md leading-relaxed">
                BİM'in tüm aktüel ve indirimli ürünlerini tek bir noktadan takip etmenizi sağlayan en modern platform. En uygun fiyatlar, her zaman cebinizde.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-8">Kurumsal</h4>
              <ul className="space-y-4 text-text-muted">
                <li className="hover:text-primary cursor-pointer transition-colors">Ana Sayfa</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Kampanyalar</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Hakkımızda</li>
                <li className="hover:text-primary cursor-pointer transition-colors">İletişim</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-8">Bizi Takip Edin</h4>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-color border border-surface-border flex items-center justify-center hover:bg-primary transition-all cursor-pointer">
                  <Heart className="w-6 h-6" />
                </div>
                {/* Social icons would go here */}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-4 text-text-muted text-sm">
            <span>© 2026 MarketFırsatları. Tüm hakları saklıdır.</span>
            <div className="flex gap-8">
              <span className="hover:text-white cursor-pointer transition-colors">Kullanım Koşulları</span>
              <span className="hover:text-white cursor-pointer transition-colors">Gizlilik Politikası</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
