import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainTabs} from './src/MainTabs';
import {Onboarding} from './src/Onboarding';
import {themePalettes, type ThemeMode} from './src/theme';

const ONBOARDING_KEY = 'chewy.onboardingComplete';
const THEME_KEY = 'chewy.theme';

function ChewyRoot() {
  const insets = useSafeAreaInsets();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('day');
  const [tabBackground, setTabBackground] = useState<string | null>(null);
  const homeScrollY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(ONBOARDING_KEY), AsyncStorage.getItem(THEME_KEY)])
      .then(([complete, savedTheme]) => {
        if (savedTheme === 'day' || savedTheme === 'evening' || savedTheme === 'forest' || savedTheme === 'night') setTheme(savedTheme);
        setCompleted(complete === 'true');
      })
      .catch(() => setCompleted(false));
  }, []);

  async function changeTheme(nextTheme: ThemeMode) {
    await AsyncStorage.setItem(THEME_KEY, nextTheme);
    setTheme(nextTheme);
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setTabBackground(null);
    homeScrollY.setValue(0);
    setCompleted(true);
  }
  async function replayOnboarding() {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
  }

  const palette = themePalettes[theme];
  const onHome = tabBackground === palette.sky || (tabBackground === null && completed);
  const rootStyle = {flex: 1, backgroundColor: completed ? (onHome ? palette.ground : tabBackground ?? palette.screen) : '#9be5f4', paddingTop: completed ? insets.top : 0, paddingBottom: completed ? insets.bottom : 0};
  return <View style={rootStyle}>
    {completed && onHome && <Animated.View pointerEvents="none" style={[styles.homeStatusSky, {height: insets.top, backgroundColor: palette.sky, opacity: homeScrollY.interpolate({inputRange: [160, 230], outputRange: [1, 0], extrapolate: 'clamp'})}]} />}
    <StatusBar barStyle={completed && onHome ? palette.statusBar : 'dark-content'} />
    {completed === null ? null : completed
      ? <MainTabs theme={theme} onThemeChange={changeTheme} onReplay={replayOnboarding} onBackgroundChange={setTabBackground} homeScrollY={homeScrollY} />
      : <Onboarding initialTheme={theme} onComplete={finishOnboarding} />}
  </View>;
}

const styles = StyleSheet.create({
  homeStatusSky: {position: 'absolute', top: 0, left: 0, right: 0},
});

export default function App() {
  return <SafeAreaProvider><ChewyRoot /></SafeAreaProvider>;
}
