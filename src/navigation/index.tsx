import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useT } from '../i18n';
import IconHorse from '../components/icons/IconHorse';
import IconSearch from '../components/icons/IconSearch';
import IconReport from '../components/icons/IconReport';
import IconProfile from '../components/icons/IconProfile';
import type { Session } from '@supabase/supabase-js';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HerdsScreen from '../screens/herds/HerdsScreen';
import HerdDetailScreen from '../screens/herds/HerdDetailScreen';
import HorseDetailScreen from '../screens/horses/HorseDetailScreen';
import AddHorseScreen from '../screens/horses/AddHorseScreen';
import EditHorseScreen from '../screens/horses/EditHorseScreen';
import ShireTreeScreen from '../screens/horses/ShireTreeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type RootStackParamList = { Auth: undefined; Main: undefined };
export type AuthStackParamList = { Login: undefined; Register: undefined };
export type MainTabParamList = {
  HerdsTab: undefined;
  SearchTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};
export type HerdsStackParamList = {
  Herds: undefined;
  HerdDetail: { herdId: string; herdName: string };
  HorseDetail: { horseId: string };
  AddHorse: { herdId?: string };
  EditHorse: { horseId: string };
  ShireTree: { horseId: string; horseBrand: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HerdsStack = createNativeStackNavigator<HerdsStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HerdsNavigator() {
  const { C } = useTheme();
  const t = useT();
  return (
    <HerdsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.gold,
        headerTitleStyle: { fontWeight: 'bold', color: C.textSub },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <HerdsStack.Screen name="Herds" component={HerdsScreen} options={{ title: t.nav_myHerds }} />
      <HerdsStack.Screen name="HerdDetail" component={HerdDetailScreen} options={({ route }) => ({ title: route.params.herdName })} />
      <HerdsStack.Screen name="HorseDetail" component={HorseDetailScreen} options={{ title: '' }} />
      <HerdsStack.Screen name="AddHorse" component={AddHorseScreen} options={{ title: t.nav_addHorse }} />
      <HerdsStack.Screen name="EditHorse" component={EditHorseScreen} options={{ title: t.nav_editHorse }} />
      <HerdsStack.Screen name="ShireTree" component={ShireTreeScreen} options={({ route }) => ({ title: `🌳 ${route.params.horseBrand}` })} />
    </HerdsStack.Navigator>
  );
}

function MainNavigator() {
  const { C } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 54 + insets.bottom;
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1, height: tabBarHeight, paddingBottom: insets.bottom + 4, paddingTop: 6 },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
        headerShown: false,
      }}
    >
      <MainTab.Screen
        name="HerdsTab"
        component={HerdsNavigator}
        options={{ tabBarLabel: t.nav_herds, tabBarIcon: ({ color }) => <IconHorse size={26} color={color} /> }}
      />
      <MainTab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: t.nav_search,
          tabBarIcon: ({ color }) => <IconSearch size={22} color={color} />,
          headerShown: true,
          headerTitle: t.nav_search,
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
      <MainTab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          tabBarLabel: t.nav_reports,
          tabBarIcon: ({ color }) => <IconReport size={22} color={color} />,
          headerShown: true,
          headerTitle: t.nav_reports_title,
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: t.nav_profile,
          tabBarIcon: ({ color }) => <IconProfile size={22} color={color} />,
          headerShown: true,
          headerTitle: t.nav_profile_title,
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
    </MainTab.Navigator>
  );
}

async function handleAuthDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return;
    }
    // implicit flow — tokens in hash fragment
    const hash = parsed.hash;
    if (hash) {
      const hp = new URLSearchParams(hash.replace(/^#/, ''));
      const access_token = hp.get('access_token');
      const refresh_token = hp.get('refresh_token') ?? '';
      if (access_token) await supabase.auth.setSession({ access_token, refresh_token });
    }
  } catch {}
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth deep links (e.g. shezhire://auth-callback?code=...)
  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) handleAuthDeepLink(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthDeepLink(url));
    return () => sub.remove();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session
          ? <RootStack.Screen name="Main" component={MainNavigator} />
          : <RootStack.Screen name="Auth" component={AuthNavigator} />}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
