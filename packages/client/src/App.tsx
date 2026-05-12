import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShoppingBag, Heart, Menu, X, ArrowRight, Tag, Clock } from 'lucide-react';
import { Product, Market } from './types';

const API_BASE_URL = 'http://localhost:5000/api';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedMarket, searchTerm]);

  const fetchInitialData = async () => {
    try {
      const marketsRes = await axios.get(`${API_BASE_URL}/markets`);
      setMarkets(marketsRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedMarket) params.marketId = selectedMarket;
      if (searchTerm) params.search = searchTerm;
      
      const res = await axios.get(`${API_BASE_URL}/products`, { params });
      setProducts(res.data);
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
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight">Market<span className="text-primary">App</span></span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input 
              type="text" 
              placeholder="Ürün veya market ara..." 
              className="w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button className="text-text-muted hover:text-white flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Favorilerim
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
          <section className="relative rounded-3xl overflow-hidden mb-12 animate-fade-in" style={{ height: '400px' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent z-10"></div>
            <img 
              src="/hero.png" 
              alt="Hero" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl">
              <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-bold w-fit mb-4">HAFTALIK FIRSATLAR</span>
              <h1 className="text-5xl font-bold mb-6 leading-tight">En Uygun Fiyatlar, <br />Artık Cebinizde.</h1>
              <p className="text-lg text-text-muted mb-8">BİM, A101, ŞOK ve Migros indirimlerini anlık olarak takip edin, tasarruf etmeye bugün başlayın.</p>
              <div className="flex gap-4">
                <button className="bg-white text-bg-color px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  İndirimleri Gör <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Market Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Marketlere Göre Göz At</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {markets.map((market) => (
                <button 
                  key={market._id}
                  onClick={() => setSelectedMarket(selectedMarket === market._id ? null : market._id)}
                  className={`glass p-6 flex flex-col items-center gap-4 transition-all hover:scale-[1.02] ${selectedMarket === market._id ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center p-2">
                    {market.logoUrl ? (
                      <img src={market.logoUrl} alt={market.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-bold text-2xl">{market.name[0]}</span>
                    )}
                  </div>
                  <span className="font-semibold">{market.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Öne Çıkan İndirimler</h2>
              <div className="flex items-center gap-2 text-text-muted">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Son güncelleme: 5 dakika önce</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="glass h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="glass group overflow-hidden transition-all hover:translate-y-[-4px]">
                    <div className="relative aspect-square bg-white/5 p-4 flex items-center justify-center">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/300'} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                      />
                      {product.discountRate && (
                        <div className="absolute top-3 left-3 bg-accent text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          %{product.discountRate}
                        </div>
                      )}
                      <button className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                           {typeof product.marketId === 'object' ? product.marketId.name : 'Market'}
                         </span>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-4 h-10">{product.name}</h3>
                      <div className="flex items-end gap-3">
                        <span className="text-xl font-bold text-white">₺{product.price.toFixed(2)}</span>
                        {product.oldPrice && (
                          <span className="text-sm text-text-muted line-through mb-1">₺{product.oldPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && products.length === 0 && (
              <div className="text-center py-20">
                <p className="text-text-muted">Aradığınız kriterlere uygun ürün bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-border py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-bold tracking-tight">Market<span className="text-primary">App</span></span>
              </div>
              <p className="text-text-muted max-w-sm">
                Türkiye'nin en büyük marketlerinin indirimlerini tek bir noktadan takip etmenizi sağlayan modern platform.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Bağlantılar</h4>
              <ul className="space-y-4 text-text-muted">
                <li className="hover:text-white cursor-pointer transition-colors">Ana Sayfa</li>
                <li className="hover:text-white cursor-pointer transition-colors">Hakkımızda</li>
                <li className="hover:text-white cursor-pointer transition-colors">İletişim</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-text-muted">
                <li className="hover:text-white cursor-pointer transition-colors">Kullanım Koşulları</li>
                <li className="hover:text-white cursor-pointer transition-colors">Gizlilik Politikası</li>
                <li className="hover:text-white cursor-pointer transition-colors">Çerez Politikası</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-surface-border text-center text-text-muted text-sm">
            © 2026 MarketApp. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
