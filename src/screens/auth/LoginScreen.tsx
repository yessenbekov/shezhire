import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Қате', error.message);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>🐎 Шежіре</Text>
      <Text style={styles.subtitle}>Ат тегінің кітабы</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Құпия сөз"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Кіруде...' : 'Кіру'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Тіркелу</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e8b84b', textAlign: 'center', marginBottom: 48 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#e8b84b', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#e8b84b', textAlign: 'center', marginTop: 20, fontSize: 15 },
});
