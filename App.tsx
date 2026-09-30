import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainTabs, homeGround, homeSky} from './src/MainTabs';
import {Onboarding} from './src/Onboarding';
import {colors} from './src/theme';

const ONBOARDING_KEY = 'chewy.onboardingComplete';

function ChewyRoot() {
  const insets = useSafeAreaInsets();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [tabBackground, setTabBackground] = useState(colors.background);
  const homeScrollY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(value => setCompleted(value === 'true'))
      .catch(() => setCompleted(false));
  }, []);

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setCompleted(true);
  }
  async function replayOnboarding() {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
  }

  return <View style={{flex: 1, backgroundColor: completed ? (tabBackground === homeSky ? homeGround : tabBackground) : colors.background, paddingTop: insets.top, paddingBottom: insets.bottom}}>
    {completed && tabBackground === homeSky && <Animated.View pointerEvents="none" style={[styles.homeStatusSky, {height: insets.top, opacity: homeScrollY.interpolate({inputRange: [160, 230], outputRange: [1, 0], extrapolate: 'clamp'})}]} />}
    <StatusBar barStyle="dark-content" />
    {completed === null ? null : completed
      ? <MainTabs onReplay={replayOnboarding} onBackgroundChange={setTabBackground} homeScrollY={homeScrollY} />
      : <Onboarding onComplete={finishOnboarding} />}
  </View>;
}

const styles = StyleSheet.create({
  homeStatusSky: {position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: homeSky},
});

export default function App() {
  return <SafeAreaProvider><ChewyRoot /></SafeAreaProvider>;
}
