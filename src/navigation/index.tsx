import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { supabase } from '../lib/supabase';
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

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HerdsTab: undefined;
  SearchTab: undefined;
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
  return (
    <HerdsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2A1210' },
        headerTintColor: '#C8922A',
        headerTitleStyle: { fontWeight: 'bold', color: '#F5E6C8' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#1C0A0A' },
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
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2A1210',
          borderTopColor: '#5A2820',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#C8922A',
        tabBarInactiveTintColor: '#5A3A2A',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
        headerShown: false,
      }}
    >
      <MainTab.Screen
        name="HerdsTab"
        component={HerdsNavigator}
        options={{
          tabBarLabel: 'Табундар',
          tabBarIcon: ({ color }) => <IconHorse size={26} color={color} />,
        }}
      />
      <MainTab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Іздеу',
          tabBarIcon: ({ color }) => <IconSearch size={22} color={color} />,
          headerShown: true,
          headerTitle: 'Іздеу',
          headerStyle: { backgroundColor: '#2A1210' },
          headerTitleStyle: { color: '#F5E6C8', fontWeight: 'bold' },
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
