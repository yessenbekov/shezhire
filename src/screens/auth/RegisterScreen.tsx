import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';

WebBrowser.maybeCompleteAuthSession();

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

const AMBER = '#B8740A';
const AMBER_LIGHT = '#D4973A';
const BG = '#FAF5E8';
const CARD = '#FFFFFF';
const TEXT = '#2C1808';
const TEXT_SUB = '#8B5A2A';
const BORDER = '#E2C98A';
const INPUT_BG = '#FBF6EC';
const PLACEHOLDER = '#C4A26A';

function AppLogo() {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24">
      <Path d="M12 22 L12 14" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14 L7 9"  stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 14 L17 9" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 9 L4.5 5.5"  stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M7 9 L9.5 5.5"  stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M17 9 L14.5 5.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M17 9 L19.5 5.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <Circle cx="12" cy="22" r="1.6" fill={AMBER} />
      <Circle cx="12" cy="14" r="2.1" fill={AMBER} />
      <Circle cx="7"  cy="9"   r="1.8" fill={AMBER} />
      <Circle cx="17" cy="9"   r="1.8" fill={AMBER} />
      <Circle cx="4.5"  cy="5.5" r="1.9" fill={AMBER} />
      <Circle cx="9.5"  cy="5.5" r="1.9" fill={AMBER} />
      <Circle cx="14.5" cy="5.5" r="1.9" fill={AMBER} />
      <Circle cx="19.5" cy="5.5" r="1.9" fill={AMBER} />
    </Svg>
  );
}

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
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      Alert.alert('Қате', error.message);
    } else {
      Alert.alert('Сәтті!', 'Тіркелу сәтті өтті!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const redirectUrl = 'shezhire://auth-callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      Alert.alert('Қате', error?.message ?? 'Google кіру қол жетімсіз');
      setGoogleLoading(false);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const access_token = result.url.match(/[#&]access_token=([^&]+)/)?.[1];
      const refresh_token = result.url.match(/[#&]refresh_token=([^&]+)/)?.[1] ?? '';
      if (access_token) {
        const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessErr) Alert.alert('Қате', sessErr.message);
        setGoogleLoading(false);
        return;
      }
      const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchErr) Alert.alert('Қате', exchErr.message);
      }
    }
    setGoogleLoading(false);
  }

  return (
    <KeyboardAvoidingView style={s.outer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo (compact for register) ── */}
        <View style={s.logoSection}>
          <View style={s.logoCircle}>
            <AppLogo />
          </View>
          <Text style={s.brand}>ШЕЖІРЕ</Text>
          <Text style={s.tagline}>ЖАҢА АККАУНТ</Text>
        </View>

        {/* ── Form card ── */}
        <View style={s.card}>
          <Text style={s.label}>Аты-жөні</Text>
          <TextInput
            style={s.input}
            placeholder="Аты Жөні"
            placeholderTextColor={PLACEHOLDER}
            value={fullName}
            onChangeText={setFullName}
            returnKeyType="next"
          />
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="email@example.com"
            placeholderTextColor={PLACEHOLDER}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <Text style={s.label}>Құпия сөз</Text>
          <TextInput
            style={[s.input, s.inputLast]}
            placeholder="••••••••"
            placeholderTextColor={PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={signUp}
          />
        </View>

        {/* ── Register button ── */}
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={signUp} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Тіркелуде...' : 'Тіркелу'}</Text>
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>немесе</Text>
          <View style={s.dividerLine} />
        </View>

        {/* ── Google ── */}
        <TouchableOpacity style={s.googleBtn} onPress={signInWithGoogle} disabled={googleLoading}>
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleText}>{googleLoading ? 'Жүктелуде...' : 'Google арқылы кіру'}</Text>
        </TouchableOpacity>

        {/* ── Login link ── */}
        <TouchableOpacity style={s.linkRow} onPress={() => navigation.navigate('Login')}>
          <Text style={s.linkGray}>Аккаунт бар ма?  </Text>
          <Text style={s.link}>Кіру</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#C8922A14', borderWidth: 1.5, borderColor: '#C8922A30',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: AMBER, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 4,
  },
  brand: {
    fontSize: 30, fontWeight: '800', color: AMBER, letterSpacing: 5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagline: {
    fontSize: 10, color: TEXT_SUB, marginTop: 5,
    letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '500',
  },

  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 22,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#F0E4C8',
  },
  label: {
    fontSize: 11, fontWeight: '700', color: TEXT_SUB,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: INPUT_BG, color: TEXT, borderRadius: 12,
    padding: 14, marginBottom: 18, fontSize: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  inputLast: { marginBottom: 0 },

  btn: {
    backgroundColor: AMBER_LIGHT, borderRadius: 16, padding: 17,
    alignItems: 'center', marginBottom: 4,
    shadowColor: AMBER, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E4CEAA' },
  dividerText: { color: '#B8936A', fontSize: 13, marginHorizontal: 14 },

  googleBtn: {
    backgroundColor: CARD, borderRadius: 16, padding: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E4CEAA',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  googleG: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  googleText: { color: TEXT, fontWeight: '700', fontSize: 16 },

  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  linkGray: { color: '#B8936A', fontSize: 15 },
  link: { color: AMBER, fontSize: 15, fontWeight: '700' },
});
