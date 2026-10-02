import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import {Text} from './AppText';
import {ChewyCharacter} from './ChewyCharacter';
import {cartoon, colors, themePalettes, type ThemeMode} from './theme';

function Cloud({width = 110}: {width?: number}) {
  return <Svg width={width} height={width * 0.5} viewBox="0 0 110 55" fill="none">
    <Path d="M20 43C8 43 6 34 11 27c4-6 11-8 17-5 2-12 13-20 25-19 12 1 19 9 21 20 11-6 24 1 24 12 0 6-5 10-13 10H20Z" fill="#fffdf0" opacity={0.94} />
  </Svg>;
}

function Scene({step}: {step: number}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!mounted || reduceMotion) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(drift, {toValue: 1, duration: 4400, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(drift, {toValue: 0, duration: 4400, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]));
      loop.start();
    });
    return () => {mounted = false; loop?.stop();};
  }, [drift]);

  const cloudShift = drift.interpolate({inputRange: [0, 1], outputRange: [-12, 14]});
  const sparkleOpacity = drift.interpolate({inputRange: [0, 1], outputRange: [0.35, 1]});
  const skyTop = step === 0 ? '#9be5f4' : step === 1 ? '#ffd9b9' : '#d7d3ff';
  const skyBottom = step === 0 ? '#d5f6dd' : step === 1 ? '#fff0c7' : '#d8f4db';

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs><LinearGradient id="onboardingSky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={skyTop} /><Stop offset="1" stopColor={skyBottom} /></LinearGradient></Defs>
      <Rect width={390} height={844} fill="url(#onboardingSky)" />
      <Circle cx={step === 1 ? 326 : 316} cy={step === 1 ? 304 : 285} r={step === 1 ? 44 : 39} fill="#fff0aa" opacity={0.95} />
      <Path d="M0 490C86 449 146 476 213 452c67-24 121-20 177 19v373H0Z" fill={step === 1 ? '#8bd9b0' : '#96e3b1'} />
      <Path d="M0 555c88-55 140-27 208-49 69-23 131-7 182 31v307H0Z" fill={step === 1 ? '#40be91' : '#50ce91'} />
      <Path d="M0 629c94-27 155-64 232-50 59 10 112 25 158-2v267H0Z" fill={step === 1 ? '#08a977' : '#16b77b'} />
      <Path d="M-8 723c112-32 183-20 270-42 59-15 94-12 136-4v167H-8Z" fill={step === 2 ? '#079c76' : '#079e75'} />
      <Path d="M-8 792c117-31 195-19 274-31 58-8 96-7 132 1v82H-8Z" fill="#068e6e" />
      <Path d="M27 537c-12-21-4-36 8-35 8 0 14 9 14 18 10-18 24-16 27-6 3 10-5 19-18 25m258-11c-8-23-1-38 11-37 10 1 14 11 13 21 13-15 26-9 25 2-1 10-10 15-22 17" fill="#008f6d" />
      <Path d="M53 553v35m284-54v43" stroke="#007e68" strokeWidth={7} strokeLinecap="round" />
      <Path d="M94 619c-7-14 1-25 10-20 5 3 7 8 7 13 6-10 15-10 18-4 4 7-2 14-12 16m168-27c-7-14 0-24 8-21 6 2 9 8 8 14 8-11 17-9 20-2 3 7-3 14-13 16" fill="#007f67" />
      <Circle cx={76} cy={592} r={5} fill="#ffe88f" /><Circle cx={81} cy={589} r={2} fill="#ff9a99" />
      <Circle cx={286} cy={567} r={5} fill="#ffe88f" /><Circle cx={289} cy={565} r={2} fill="#ff9a99" />
    </Svg>
    <Animated.View style={[styles.cloudLeft, {transform: [{translateX: cloudShift}]}]}><Cloud width={102} /></Animated.View>
    <Animated.View style={[styles.cloudRight, {transform: [{translateX: cloudShift}]}]}><Cloud width={76} /></Animated.View>
    <View style={styles.character}><ChewyCharacter size={220} expression={step === 1 ? 'calm' : 'happy'} /></View>
    {step > 0 && <View style={styles.sceneBadge}><Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={25} fill={cartoon.sunshine} stroke={colors.green} strokeWidth={2.5} />
      {step === 1 ? <><Circle cx={28} cy={29} r={13} stroke={colors.green} strokeWidth={2.5} /><Path d="M28 20v9l6 4M23 12h10" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></> : <><Rect x={18} y={15} width={20} height={28} rx={4} stroke={colors.green} strokeWidth={2.5} /><Path d="M23 22v14m10-14v14" stroke={colors.green} strokeWidth={3} strokeLinecap="round" /></>}
    </Svg></View>}
    <Animated.View style={[styles.sceneSparkle, {opacity: sparkleOpacity}]}><Svg width={35} height={35} viewBox="0 0 35 35"><Path d="M17.5 2c2 9 6.5 13.5 15.5 15.5-9 2-13.5 6.5-15.5 15.5C15.5 24 11 19.5 2 17.5 11 15.5 15.5 11 17.5 2Z" fill="#fff5ab" /></Svg></Animated.View>
  </View>;
}

function OpeningEffect({onFinish, sky}: {onFinish: () => void; sky: string}) {
  const burst = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) return;
      if (reduceMotion) {
        finishRef.current();
        return;
      }
      animation = Animated.sequence([
        Animated.parallel([
          Animated.timing(burst, {toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
          Animated.sequence([
            Animated.timing(bounce, {toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true}),
            Animated.timing(bounce, {toValue: 2, duration: 370, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
          ]),
          Animated.timing(twinkle, {toValue: 1, duration: 780, useNativeDriver: true}),
        ]),
        Animated.delay(220),
      ]);
      animation.start(({finished}) => {if (active && finished) finishRef.current();});
    }).catch(() => {if (active) finishRef.current();});
    return () => {active = false; animation?.stop();};
  }, [burst, bounce, twinkle]);

  return <View style={styles.openingEffect} pointerEvents="auto" accessibilityLabel="Opening Chewy">
    <Animated.View style={[styles.openingBurst, {backgroundColor: sky, transform: [{scale: burst.interpolate({inputRange: [0, 1], outputRange: [0.05, 12]})}]}]} />
    <Animated.View style={[styles.openingMascot, {opacity: bounce.interpolate({inputRange: [0, 0.1, 2], outputRange: [0, 1, 1]}), transform: [{translateY: bounce.interpolate({inputRange: [0, 1, 2], outputRange: [75, -25, 0]})}, {scale: bounce.interpolate({inputRange: [0, 1, 2], outputRange: [0.5, 1.18, 1]})}]}]}><ChewyCharacter size={190} expression="happy" /></Animated.View>
    <Animated.Text style={[styles.openingSparkle, styles.openingSparkleLeft, {opacity: twinkle, transform: [{scale: twinkle.interpolate({inputRange: [0, 1], outputRange: [0.2, 1.4]})}]}]}>✦</Animated.Text>
    <Animated.Text style={[styles.openingSparkle, styles.openingSparkleRight, {opacity: twinkle, transform: [{scale: twinkle.interpolate({inputRange: [0, 1], outputRange: [0.2, 1.1]})}]}]}>✦</Animated.Text>
  </View>;
}

export function Onboarding({initialTheme = 'day', onComplete}: {initialTheme?: ThemeMode; onComplete: () => void | Promise<void>}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const finishing = useRef(false);
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageOffset = useRef(new Animated.Value(0)).current;
  const changingPage = useRef(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {if (active) reduceMotion.current = value;});
    return () => {active = false;};
  }, []);

  useEffect(() => () => {
    pageOpacity.stopAnimation();
    pageOffset.stopAnimation();
  }, [pageOpacity, pageOffset]);

  function goToStep(nextStep: number) {
    if (busy || changingPage.current || nextStep === step || nextStep < 0 || nextStep > 2) return;
    if (reduceMotion.current) {
      setStep(nextStep);
      return;
    }
    changingPage.current = true;
    const direction = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(pageOpacity, {toValue: 0, duration: 150, useNativeDriver: true}),
      Animated.timing(pageOffset, {toValue: direction * -24, duration: 150, useNativeDriver: true}),
    ]).start(({finished}) => {
      if (!finished) {changingPage.current = false; return;}
      setStep(nextStep);
      pageOffset.setValue(direction * 24);
      Animated.parallel([
        Animated.timing(pageOpacity, {toValue: 1, duration: 330, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(pageOffset, {toValue: 0, duration: 330, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      ]).start(() => {changingPage.current = false;});
    });
  }

  async function finishOnboarding() {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      await onComplete();
    } catch {
      finishing.current = false;
      setBusy(false);
      setOpening(false);
      Alert.alert('Could not save your setup', 'Please try again.');
    }
  }

  function continueOnboarding() {
    if (busy || changingPage.current) return;
    if (step < 2) {
      goToStep(step + 1);
      return;
    }
    setBusy(true);
    setOpening(true);
  }

  const buttonLabel = step === 0 ? 'Get started' : step === 1 ? 'Next' : 'Open Chewy';

  return <View style={styles.screen}><Animated.View style={[styles.page, {opacity: pageOpacity, transform: [{translateX: pageOffset}]}]}>
    <Scene key={step} step={step} />
    <View style={[styles.overlay, {paddingTop: insets.top + 13, paddingBottom: Math.max(insets.bottom, 12) + 12}]}>
      <View style={styles.header}>
        {step > 0 && <Pressable style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back" disabled={busy} onPress={() => goToStep(step - 1)}><Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Path d="m12 4-6 6 6 6" stroke={colors.green} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg></Pressable>}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{step === 0 ? 'WELCOME TO CHEWY' : step === 1 ? 'MAKE SPACE TO FOCUS' : 'YOUR APPS, YOUR CHOICE'}</Text>
          <Text style={styles.title}>{step === 0 ? 'More living.\nLess scrolling.' : step === 1 ? 'Give your mind room to breathe.' : 'Pause the apps that pull you in.'}</Text>
          <Text style={styles.description}>{step === 0 ? 'Chewy helps you step away from distractions and make more room for people, play, and rest.' : step === 1 ? 'Focus on one thing at a time, then take a short break. A gentle rhythm can help your mind feel less crowded.' : 'Choose apps that distract you. Chewy gives you a moment to pause before another scroll.'}</Text>
        </View>
        <View style={styles.flexSpace} />
        {step === 0 && <View style={styles.storyCard}><Text style={styles.storySymbol}>✦</Text><Text style={styles.storyText}>A calmer day can begin with one small choice.</Text></View>}
        {step === 1 && <View style={styles.featureCard}><View style={[styles.featureIcon, styles.focusIcon]}><Text style={styles.featureSymbol}>◷</Text></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>Focus, then recharge</Text><Text style={styles.featureBody}>Use Chewy’s timer for one task. Pause or take a break whenever you need.</Text></View></View>}
        {step === 2 && <View style={styles.featureCard}><View style={styles.featureIcon}><Text style={styles.featureSymbol}>Ⅱ</Text></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>Pick your distractions</Text><Text style={styles.featureBody}>On Android, select apps in Block and enable Chewy’s service to show a pause screen.</Text></View></View>}
      </ScrollView>

      <View style={styles.dots} accessibilityLabel={`Page ${step + 1} of 3`}>{[0, 1, 2].map(index => <Pressable key={index} onPress={() => goToStep(index)} accessibilityRole="button" accessibilityLabel={`Go to page ${index + 1}`} accessibilityState={{selected: index === step}} hitSlop={8} style={[styles.dot, index === step && styles.activeDot]} />)}</View>
      <Pressable style={[styles.primary, busy && styles.disabled]} onPress={continueOnboarding} disabled={busy} accessibilityRole="button" accessibilityLabel={buttonLabel}><Text style={styles.primaryText}>{busy ? 'One moment…' : buttonLabel}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
    </View>
  </Animated.View>{opening && <OpeningEffect sky={themePalettes[initialTheme].sky} onFinish={finishOnboarding} />}</View>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, overflow: 'hidden', backgroundColor: '#9be5f4'},
  openingEffect: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  openingBurst: {position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#43cff3'},
  openingMascot: {alignItems: 'center', justifyContent: 'center'},
  openingSparkle: {position: 'absolute', fontSize: 55, color: cartoon.sunshine},
  openingSparkleLeft: {left: '15%', top: '37%'},
  openingSparkleRight: {right: '14%', bottom: '34%'},
  page: {flex: 1},
  overlay: {flex: 1, paddingHorizontal: 22},
  cloudLeft: {position: 'absolute', left: 15, top: '27%'},
  cloudRight: {position: 'absolute', right: 18, top: '32%'},
  character: {position: 'absolute', top: '38%', alignSelf: 'center'},
  sceneBadge: {position: 'absolute', top: '38%', right: '13%'},
  sceneSparkle: {position: 'absolute', top: '38%', right: '17%'},
  header: {height: 48, flexDirection: 'row', alignItems: 'center'},
  backButton: {width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.green, backgroundColor: cartoon.sunshine, alignItems: 'center', justifyContent: 'center'},
  content: {flexGrow: 1, paddingTop: 25, paddingBottom: 22},
  copy: {alignItems: 'center'},
  eyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 2.5, color: colors.green, marginBottom: 9},
  title: {fontSize: 35, lineHeight: 40, fontWeight: '900', textAlign: 'center', color: colors.ink, maxWidth: 345},
  description: {fontSize: 15, lineHeight: 21, textAlign: 'center', color: colors.ink, maxWidth: 330, marginTop: 12, fontWeight: '600'},
  flexSpace: {flexGrow: 1, minHeight: 220},
  storyCard: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffbeeeb', borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 16},
  storySymbol: {fontSize: 27, color: colors.green},
  storyText: {flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '800', color: colors.green},
  featureCard: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffbeeef', borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, borderRadius: 22, padding: 12},
  featureIcon: {width: 48, height: 48, backgroundColor: cartoon.sunshine, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  focusIcon: {backgroundColor: cartoon.mint},
  featureSymbol: {fontSize: 28, color: colors.green, fontWeight: '900'},
  featureCopy: {flex: 1},
  featureTitle: {fontSize: 15, fontWeight: '900', color: colors.ink},
  featureBody: {fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 2},
  dots: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 11, marginBottom: 15},
  dot: {width: 11, height: 11, borderRadius: 6, backgroundColor: '#fffbee', borderWidth: 1.5, borderColor: colors.green},
  activeDot: {width: 13, height: 13, borderRadius: 7, backgroundColor: cartoon.sunshine, borderWidth: 2},
  primary: {height: 56, borderRadius: 28, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: cartoon.sunshine, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  primaryText: {fontSize: 16, fontWeight: '900', color: colors.green},
  primaryArrow: {fontSize: 22, fontWeight: '900', color: colors.green},
  disabled: {opacity: 0.55},
});
