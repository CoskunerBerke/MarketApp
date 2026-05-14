import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { token: authToken, user: currentUser, logout, login } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || (!isForgot && !isReset && !password)) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        const response = await api.post('/auth/forgot-password', { email });
        Alert.alert('Bilgi', response.data.message);
        setIsForgot(false);
        setIsReset(true);
      } else if (isReset) {
        const response = await api.post('/auth/reset-password', { email, token, newPassword });
        Alert.alert('Başarılı', response.data.message);
        setIsReset(false);
        setIsLogin(true);
      } else {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const response = await api.post(endpoint, { email, password });
        
        // Match backend response structure
        const userData = {
          id: response.data._id,
          email: response.data.email,
          role: response.data.role,
          favorites: response.data.favorites || []
        };
        await login(response.data.token, userData);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Sunucuya bağlanılamadı.';
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => {
    if (isForgot) return 'Şifremi Unuttum';
    if (isReset) return 'Şifreyi Sıfırla';
    return isLogin ? 'Tekrar Hoş Geldin' : 'Bize Katıl';
  };

  if (authToken && currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <View style={styles.profileBadge}>
             <Ionicons name="person" size={40} color="white" />
          </View>
          <Text style={styles.profileEmail}>{currentUser.email}</Text>
          <Text style={styles.profileSub}>MarketFırsat Üyesi</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.accentRed, marginTop: 40 }]} 
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
           <View style={styles.logoCircle}>
              <Ionicons name="bag-handle" size={40} color={theme.colors.primary} />
           </View>
           <Text style={styles.title}>{renderTitle()}</Text>
           <Text style={styles.subtitle}>
              {isLogin ? 'En iyi market fırsatlarını takip etmek için giriş yap.' : 'Hemen üye ol, favorilerini kaydetmeye başla.'}
           </Text>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>E-posta</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresiniz"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isReset}
            />
          </View>

          {isReset && (
            <>
              <Text style={styles.label}>Sıfırlama Kodu</Text>
              <View style={styles.inputContainer}>
                 <Ionicons name="key-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                 <TextInput
                  style={styles.input}
                  placeholder="6 haneli kod"
                  placeholderTextColor={theme.colors.textMuted}
                  value={token}
                  onChangeText={setToken}
                  keyboardType="number-pad"
                />
              </View>
              
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.inputContainer}>
                 <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                 <TextInput
                  style={styles.input}
                  placeholder="Yeni şifreniz"
                  placeholderTextColor={theme.colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}

          {!isForgot && !isReset && (
            <>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifreniz"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}

          <Pressable 
            style={({ pressed }) => [
              styles.button,
              (pressed || loading) && { opacity: 0.8, backgroundColor: theme.colors.primaryDark }
            ]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isForgot ? 'Kod Gönder' : isReset ? 'Güncelle' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
              </Text>
            )}
          </Pressable>

          {!isForgot && !isReset && (
            <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin ? 'Hesabınız yok mu? ' : 'Zaten üye misiniz? '}
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                   {isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {isLogin && !isForgot && !isReset && (
            <TouchableOpacity style={[styles.switchButton, { marginTop: 15 }]} onPress={() => setIsForgot(true)}>
              <Text style={[styles.switchText, { color: theme.colors.textMuted, fontSize: 13 }]}>
                Şifremi Unuttum
              </Text>
            </TouchableOpacity>
          )}
          
          {(isForgot || isReset) && (
            <TouchableOpacity style={styles.switchButton} onPress={() => {
              setIsForgot(false);
              setIsReset(false);
              setIsLogin(true);
            }}>
              <Text style={styles.switchText}>Geri Dön</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileEmail: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  profileSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    color: 'white',
    padding: theme.spacing.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: 55,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  }
});
