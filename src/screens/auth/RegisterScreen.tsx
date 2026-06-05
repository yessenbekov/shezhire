import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Сәтті!', 'Email-ді тексеріңіз', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>🐎 Шежіре</Text>
      <Text style={styles.subtitle}>Тіркелу</Text>

      <TextInput style={styles.input} placeholder="Аты-жөні" placeholderTextColor="#666" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Құпия сөз" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={signUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Тіркелуде...' : 'Тіркелу'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Кіру</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 20, color: '#e8b84b', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#e8b84b', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#e8b84b', textAlign: 'center', marginTop: 20, fontSize: 15 },
});
