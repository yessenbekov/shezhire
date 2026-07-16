import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';

WebBrowser.maybeCompleteAuthSession();

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signUp() {
    if (!email || !password || !fullName) {
      Alert.alert('Қате', 'Барлық өрістерді толтырыңыз');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      Alert.alert('Қате', error.message);
    } else {
      Alert.alert('Сәтті!', 'Тіркелу сәтті өтті!', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const redirectUrl = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error || !data.url) { Alert.alert('Қате', error?.message ?? 'Google кіру қол жетімсіз'); setGoogleLoading(false); return; }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const params = new URL(result.url).searchParams;
      const code = params.get('code');
      if (code) await supabase.auth.exchangeCodeForSession(code);
    }
    setGoogleLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🐎</Text>
          <Text style={styles.logoText}>Шежіре</Text>
          <Text style={styles.subtitle}>Жаңа аккаунт</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Аты-жөні</Text>
          <TextInput
            style={styles.input}
            placeholder="Аты Жөні"
            placeholderTextColor="#4A2A1A"
            value={fullName}
            onChangeText={setFullName}
            returnKeyType="next"
          />
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#4A2A1A"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <Text style={styles.fieldLabel}>Құпия сөз</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="••••••••"
            placeholderTextColor="#4A2A1A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={signUp}
          />
        </View>

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={signUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Тіркелуде...' : 'Тіркелу'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>немесе</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} disabled={googleLoading}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>{googleLoading ? 'Жүктелуде...' : 'Google арқылы кіру'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkGray}>Аккаунт бар ма?  </Text>
          <Text style={styles.link}>Кіру</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#1C0A0A' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logoWrap: { alignItems: 'center', marginBottom: 44 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  logoText: { fontSize: 38, color: '#C8922A', fontWeight: '800', letterSpacing: 3 },
  subtitle: { fontSize: 13, color: '#7A5A3A', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' },
  form: { backgroundColor: '#2A1210', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#5A2820' },
  fieldLabel: { color: '#9A7A5A', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#1C0A0A', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#5A2820' },
  button: { backgroundColor: '#C8922A', borderRadius: 14, padding: 17, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#5A2820' },
  dividerText: { color: '#5A3A2A', fontSize: 13, marginHorizontal: 12 },
  googleBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  googleIcon: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  googleText: { color: '#1A1A1A', fontWeight: '700', fontSize: 16 },
  linkWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  linkGray: { color: '#5A3A2A', fontSize: 15 },
  link: { color: '#C8922A', fontSize: 15, fontWeight: '600' },
});
