import React, { useEffect, useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, Linking, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './src/theme';
import { getProducts, getMarkets, getFavorites, toggleFavorite } from './src/api';
import { useAuthStore } from './src/store/useAuthStore';
import { AuthScreen } from './src/screens/AuthScreen';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }: any) => {
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');

  const fetchData = async () => {
    try {
      const allProducts = await getProducts();
      // Only BİM products as per current preference
      const bimProducts = allProducts.filter((p: any) => p.marketId?.name === 'BİM');
      setProducts(bimProducts);
      
      if (token) {
        const favs = await getFavorites();
        // Backend returns Favorite objects with .product field
        setFavoriteIds(favs.map((f: any) => f.product._id));
      } else {
        setFavoriteIds([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (viewMode === 'favorites') {
      result = result.filter(p => favoriteIds.includes(p._id));
    }
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [products, searchQuery, viewMode, favoriteIds]);

  const handleToggleFavorite = async (productId: string) => {
    if (!token) {
      navigation.navigate('Profile');
      return;
    }
    try {
      const res = await toggleFavorite(productId);
      // Backend now returns updated favorites list IDs
      setFavoriteIds(res.favorites);
    } catch (error) {
      Alert.alert('Hata', 'Favori işlemi başarısız oldu.');
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>%{item.discountRate} İNDİRİM</Text>
        </View>
        <TouchableOpacity 
          style={[styles.favButton, favoriteIds.includes(item._id) && { backgroundColor: theme.colors.accentRed }]}
          onPress={() => handleToggleFavorite(item._id)}
        >
          <Ionicons 
            name={favoriteIds.includes(item._id) ? "heart" : "heart-outline"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.marketLabel}>BİM Fırsatı</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.oldPrice}>₺{item.oldPrice?.toFixed(2)}</Text>
            <Text style={styles.currentPrice}>₺{item.price?.toFixed(2)}</Text>
          </View>
          <View style={styles.arrowIcon}>
             <Ionicons name="chevron-forward" size={16} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hoş Geldin,</Text>
          <Text style={styles.brandText}>MarketFırsat</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="İndirimli ürünlerde ara..." 
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchField}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'all' && styles.tabActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.tabText, viewMode === 'all' && styles.tabTextActive]}>Tüm Ürünler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'favorites' && styles.tabActive]}
          onPress={() => {
            if (!token) navigation.navigate('Profile');
            else setViewMode('favorites');
          }}
        >
          <Ionicons name="heart" size={16} color={viewMode === 'favorites' ? 'white' : theme.colors.textMuted} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, viewMode === 'favorites' && styles.tabTextActive]}>Favorilerim</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList 
          data={filteredProducts}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
               <Ionicons name={viewMode === 'favorites' ? "heart-dislike" : "search"} size={64} color={theme.colors.surfaceLight} />
               <Text style={styles.emptyTitle}>
                 {viewMode === 'favorites' ? 'Favorin bulunmuyor' : 'Ürün bulunamadı'}
               </Text>
               <Text style={styles.emptyDesc}>
                 {viewMode === 'favorites' ? 'Kalp butonuna basarak ürün ekleyebilirsin.' : 'Farklı bir arama yapmayı dene.'}
               </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const ProductDetailScreen = ({ route }: any) => {
  const { product } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.detailCard}>
          <Image source={{ uri: product.imageUrl }} style={styles.detailImage} />
          <View style={styles.detailInfo}>
            <Text style={styles.detailMarket}>BİM AKTÜEL ÜRÜN</Text>
            <Text style={styles.detailName}>{product.name}</Text>
            
            <View style={styles.detailPriceRow}>
               <View>
                  <Text style={[styles.oldPrice, { fontSize: 18 }]}>₺{product.oldPrice?.toFixed(2)}</Text>
                  <Text style={styles.detailPrice}>₺{product.price?.toFixed(2)}</Text>
               </View>
               <View style={styles.detailDiscount}>
                  <Text style={styles.detailDiscountText}>%{product.discountRate} İNDİRİM</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => product.sourceUrl && Linking.openURL(product.sourceUrl)}
            >
              <Text style={styles.buyButtonText}>Markete Git</Text>
              <Ionicons name="open-outline" size={20} color="white" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function App() {
  const { checkAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Profile" component={AuthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 25,
  },
  welcomeText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  brandText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  searchField: {
    flex: 1,
    color: 'white',
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  productCard: {
    width: COLUMN_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    margin: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.colors.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  marketLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    height: 40,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  oldPrice: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
  },
  detailInfo: {
    paddingHorizontal: 5,
  },
  detailMarket: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 8,
  },
  detailName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  detailPrice: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  detailDiscount: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  detailDiscountText: {
    color: theme.colors.accentRed,
    fontWeight: 'bold',
    fontSize: 16,
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptyDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});
