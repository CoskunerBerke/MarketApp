import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator localhost is 10.0.2.2, for iOS simulator it is localhost.
// Replace this with your computer's local IP address (e.g., 192.168.1.X) if testing on a physical device via Expo Go.
const API_URL = 'https://market-backend-oozv.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getProducts = async (search?: string, categoryId?: string) => {
  const response = await api.get('/products', {
    params: { search, categoryId }
  });
  return response.data;
};

export const getMarkets = async () => {
  const response = await api.get('/markets');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

export const toggleFavorite = async (productId: string) => {
  const response = await api.post('/favorites', { productId });
  return response.data;
};
