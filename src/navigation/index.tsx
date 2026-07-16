import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import IconHorse from '../components/icons/IconHorse';
import IconSearch from '../components/icons/IconSearch';
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
      <HerdsStack.Screen name="Herds" component={HerdsScreen} options={{ title: 'Менің табундарым' }} />
      <HerdsStack.Screen name="HerdDetail" component={HerdDetailScreen} options={({ route }) => ({ title: route.params.herdName })} />
      <HerdsStack.Screen name="HorseDetail" component={HorseDetailScreen} options={{ title: 'Лошадь' }} />
      <HerdsStack.Screen name="AddHorse" component={AddHorseScreen} options={{ title: 'Жеребёнок қосу' }} />
      <HerdsStack.Screen name="EditHorse" component={EditHorseScreen} options={{ title: 'Өзгерту' }} />
      <HerdsStack.Screen name="ShireTree" component={ShireTreeScreen} options={({ route }) => ({ title: `Шежіре: ${route.params.horseBrand}` })} />
    </HerdsStack.Navigator>
  );
}

function MainNavigator() {
  const { C } = useTheme();
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
        options={{ tabBarLabel: 'Табундар', tabBarIcon: ({ color }) => <IconHorse size={26} color={color} /> }}
      />
      <MainTab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Іздеу',
          tabBarIcon: ({ color }) => <IconSearch size={22} color={color} />,
          headerShown: true,
          headerTitle: 'Іздеу',
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
      <MainTab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Есеп',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📊</Text>,
          headerShown: true,
          headerTitle: 'Есеп беру',
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Кабинет',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
          headerShown: true,
          headerTitle: 'Жеке кабинет',
          headerStyle: { backgroundColor: C.surface },
          headerTitleStyle: { color: C.textSub, fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
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
