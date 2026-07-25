import { useEffect, useState } from 'react';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { AlbumScreen } from '../screens/AlbumScreen';
import { ChallengeScreen } from '../screens/ChallengeScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { FootprintScreen } from '../screens/FootprintScreen';
import { MyScreen } from '../screens/MyScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { colors } from '../theme/colors';
import { AppBottomBar } from '../components/AppBottomBar';
import { LoginScreen } from '../screens/LoginScreen';
import { useAppStore } from '../store/useAppStore';
import { signInOrRegister, supabase } from '../services/supabase';
import { ensureProfile, loadMoodRecords, loadOwnPhotos } from '../services/supabaseData';
import type { MainTabParamList, RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const appTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.coral,
    background: colors.paper,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.coral,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

function MainTabs() {
  const tabIcons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
    Today: 'color-palette-outline',
    Album: 'images-outline',
    Community: 'people-outline',
    Diary: 'book-outline',
    Me: 'person-outline',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.coralDark,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { display: 'none' },
      })}
      tabBar={(props) => <AppBottomBar {...props} />}
    >
      <Tab.Screen name="Today" component={HomeScreen} options={{ title: '拍摄' }} />
      <Tab.Screen name="Album" component={AlbumScreen} options={{ title: '相册' }} />
      <Tab.Screen name="Diary" component={DiaryScreen} options={{ title: '日记' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: '伙伴' }} />
      <Tab.Screen name="Me" component={MyScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const account = useAppStore((state) => state.account);
  const setAuthenticatedAccount = useAppStore((state) => state.setAuthenticatedAccount);
  const logout = useAppStore((state) => state.logout);
  const setPhotos = useAppStore((state) => state.setPhotos);
  const setMoods = useAppStore((state) => state.setMoods);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    const applySession = (user: { id: string; email?: string | null } | null) => {
      if (user) setAuthenticatedAccount({ id: user.id, phone: '', email: user.email ?? undefined, nickname: user.email?.split('@')[0] || '小鹿', registeredAt: new Date().toISOString() });
      else logout();
    };
    void supabase.auth.getSession().then(({ data }) => { applySession(data.session?.user ?? null); setReady(true); });
    const subscription = supabase.auth.onAuthStateChange((_event, session) => applySession(session?.user ?? null));
    return () => subscription.data.subscription.unsubscribe();
  }, [logout, setAuthenticatedAccount]);

  useEffect(() => {
    if (!account?.id) return;
    let active = true;
    void (async () => {
      try {
        await ensureProfile(account);
        const [photos, moods] = await Promise.all([loadOwnPhotos(account.id!), loadMoodRecords(account.id!)]);
        if (active) {
          setPhotos(photos);
          setMoods(moods);
        }
      } catch (error) {
        console.warn('Remote user data sync failed', error);
      }
    })();
    return () => { active = false; };
  }, [account, setMoods, setPhotos]);

  const authenticate = async (email: string, password: string, register: boolean) => {
    const data = await signInOrRegister(email, password, register);
    if (!data.session || !data.user) throw new Error('注册成功，请先到邮箱确认后再登录。');
    setAuthenticatedAccount({ id: data.user.id, phone: '', email: data.user.email ?? email, nickname: data.user.email?.split('@')[0] || '小鹿', registeredAt: new Date().toISOString() });
  };

  if (!ready) return null;
  if (!account) return <LoginScreen onLogin={authenticate} />;

  return (
    <NavigationContainer theme={appTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: '分析结果', headerBackTitle: '返回' }}
        />
        <Stack.Screen
          name="Challenge"
          component={ChallengeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Footprint"
          component={FootprintScreen}
          options={{ title: '色彩足迹', headerBackTitle: '返回' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
