import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Alert, Animated, AppState, Image, Pressable, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import {ChewyCharacter} from './ChewyCharacter';
import {Text} from './AppText';
import {BlockScreen} from './BlockScreen';
import {FocusScreen} from './FocusScreen';
import {ProgressScreen} from './ProgressScreen';
import {SettingsScreen} from './SettingsScreen';
import {blocker, type TodayUsage} from './native/blocker';
import {collectExpiredFocusSession, getFocusRecords, getFocusStreak} from './progress';
import {cartoon, colors} from './theme';

type Tab = 'Home' | 'Block' | 'Focus' | 'Progress' | 'Settings';
const tabs: Tab[] = ['Home', 'Block', 'Focus', 'Progress', 'Settings'];
export const homeSky = '#75d6fb';
export const homeGround = '#0ba66c';

function TabIcon({name, color}: {name: Tab; color: string}) {
  const stroke = {stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
    {name === 'Home' && <><Path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V10Z" {...stroke} /><Path d="M10 21v-6h4v6" {...stroke} /></>}
    {name === 'Block' && <><Rect x="3" y="3" width="7" height="7" rx="1.8" {...stroke} /><Rect x="14" y="3" width="7" height="7" rx="1.8" {...stroke} /><Rect x="3" y="14" width="7" height="7" rx="1.8" {...stroke} /><Rect x="14" y="14" width="7" height="7" rx="1.8" {...stroke} /></>}
    {name === 'Focus' && <><Circle cx="12" cy="13" r="8" {...stroke} /><Path d="M12 8v5l3 2M9 2h6M12 2v3" {...stroke} /></>}
    {name === 'Progress' && <><Rect x="2.5" y="2.5" width="19" height="19" rx="5" {...stroke} /><Path d="M7.5 16v-3m4.5 3V8m4.5 8v-5" {...stroke} /></>}
    {name === 'Settings' && <><Circle cx="12" cy="12" r="8.5" {...stroke} /><Circle cx="12" cy="12" r="3" {...stroke} /><Path d="M12 1v2.5m0 17V23M1 12h2.5m17 0H23M4.2 4.2 6 6m12 12 1.8 1.8M19.8 4.2 18 6M6 18l-1.8 1.8" {...stroke} /></>}
  </Svg>;
}

function ContentIcon({name, color = colors.ink}: {name: 'phone' | 'sparkles' | 'pickups' | 'break' | 'hand' | 'chevron'; color?: string}) {
  const stroke = {stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    {name === 'phone' && <><Rect x="6" y="2" width="12" height="20" rx="2" {...stroke} /><Path d="M10 5h4m-3 14h2" {...stroke} /></>}
    {name === 'sparkles' && <><Path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" fill={color} /><Path d="m4 15 .5 1.5L6 17l-1.5.5L4 19l-.5-1.5L2 17l1.5-.5L4 15Z" fill={color} /></>}
    {name === 'pickups' && <><Rect x="6" y="2" width="12" height="20" rx="2" {...stroke} /><Path d="M9 6h6M10 18h4M2.5 8.5A8 8 0 0 1 5 5m-2.5 7A11 11 0 0 1 5 4" {...stroke} /></>}
    {name === 'break' && <><Circle cx="12" cy="13" r="8" {...stroke} /><Path d="M12 8v5l3 2M9 2h6M12 2v3" {...stroke} /></>}
    {name === 'hand' && <Path d="M6.2 12V5.2a1.2 1.2 0 0 1 2.4 0v5.2-7a1.2 1.2 0 0 1 2.4 0v7-6a1.2 1.2 0 0 1 2.4 0v6-4.6a1.2 1.2 0 0 1 2.4 0v7l1.6-2a1.8 1.8 0 0 1 2.9 2.1l-3.2 6.4a4.5 4.5 0 0 1-4 2.5h-2.8a5 5 0 0 1-4.4-2.6L3.1 13a1.8 1.8 0 0 1 3.1-1Z" {...stroke} />}
    {name === 'chevron' && <Path d="m9 5 7 7-7 7" {...stroke} />}
  </Svg>;
}

function tabBackground(tab: Tab): string {
  return tab === 'Home' ? homeSky : tab === 'Focus' ? colors.focusBackground : tab === 'Progress' ? colors.progressBackground : colors.background;
}

export function MainTabs({onReplay, onBackgroundChange, homeScrollY}: {onReplay: () => void; onBackgroundChange: (background: string) => void; homeScrollY: Animated.Value}) {
  const [tab, setTab] = useState<Tab>('Home');
  const [blockVisited, setBlockVisited] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const selectionPosition = useRef(new Animated.Value(0)).current;
  const iconSelections = useRef(tabs.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) reduceMotion.current = enabled;
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      reduceMotion.current = enabled;
    });
    return () => {mounted = false; subscription.remove();};
  }, []);

  useEffect(() => {onBackgroundChange(tabBackground(tab));}, [onBackgroundChange, tab]);

  function selectTab(nextTab: Tab) {
    if (nextTab === tab) return;
    if (nextTab === 'Home') homeScrollY.setValue(0);
    if (nextTab === 'Block') setBlockVisited(true);
    onBackgroundChange(tabBackground(nextTab));
    const nextIndex = tabs.indexOf(nextTab);
    if (reduceMotion.current) {
      selectionPosition.setValue(nextIndex);
      iconSelections.forEach((value, index) => value.setValue(index === nextIndex ? 1 : 0));
    } else {
      Animated.parallel([
        Animated.spring(selectionPosition, {toValue: nextIndex, damping: 22, stiffness: 220, mass: 0.9, overshootClamping: true, useNativeDriver: true}),
        ...iconSelections.map((value, index) => Animated.timing(value, {toValue: index === nextIndex ? 1 : 0, duration: 180, useNativeDriver: true})),
      ]).start();
    }
    setTab(nextTab);
  }

  const tabWidth = (barWidth - 6) / tabs.length;
  const selectionSize = Math.min(70, tabWidth);
  return (
    <View style={[styles.root, tab === 'Home' && styles.homeBackground, tab === 'Focus' && styles.focusBackground, tab === 'Progress' && styles.progressBackground]}>
      <View style={styles.content}>
        {tab === 'Home' && <Home open={selectTab} scrollY={homeScrollY} />}
        {blockVisited && <View style={[styles.persistentBlock, tab !== 'Block' && styles.hiddenBlock]}><BlockScreen visible={tab === 'Block'} /></View>}
        {tab === 'Focus' && <FocusScreen />}
        {tab === 'Progress' && <ProgressScreen />}
        {tab === 'Settings' && <SettingsScreen onReplay={onReplay} onOpenBlock={() => selectTab('Block')} />}
      </View>
      <View style={[styles.tabDock, tab === 'Home' && styles.homeDockBackground, tab === 'Focus' && styles.focusBackground, tab === 'Progress' && styles.progressBackground]}>
        <View style={styles.tabBar} onLayout={event => setBarWidth(event.nativeEvent.layout.width)}>
          {barWidth > 0 && <Animated.View pointerEvents="none" style={[styles.tabSelection, {width: selectionSize, height: selectionSize, top: (76 - selectionSize) / 2, left: 3 + (tabWidth - selectionSize) / 2, transform: [{translateX: selectionPosition.interpolate({inputRange: [0, tabs.length - 1], outputRange: [0, tabWidth * (tabs.length - 1)]})}]}]} />}
          {tabs.map((item, index) => <Pressable key={item} onPress={() => selectTab(item)} style={styles.tab} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{selected: item === tab}}>
            <View style={styles.tabIconWrap}><TabIcon name={item} color={colors.background} /><Animated.View pointerEvents="none" style={[styles.tabDarkIcon, {opacity: iconSelections[index]}]}><TabIcon name={item} color={colors.green} /></Animated.View></View>
          </Pressable>)}
        </View>
      </View>
    </View>
  );
}

function Home({open, scrollY}: {open: (tab: Tab) => void; scrollY: Animated.Value}) {
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [todayUsage, setTodayUsage] = useState<TodayUsage | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function refreshHome() {
      try {
        await collectExpiredFocusSession();
        const records = await getFocusRecords();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (mounted) {
          setFocusMinutes(records.filter(record => record.completedAt >= today.getTime()).reduce((total, record) => total + record.minutes, 0));
          setStreak(getFocusStreak(records));
        }
      } catch { if (mounted) setFocusMinutes(null); }
      try {
        const usage = await blocker?.getTodayUsage?.();
        if (mounted) setTodayUsage(usage ?? null);
      } catch (error) {
        console.warn('Could not load Android app usage', error);
        if (mounted) setTodayUsage(null);
      } finally {
        if (mounted) setUsageLoaded(true);
      }
    }
    refreshHome();
    const subscription = AppState.addEventListener('change', state => {if (state === 'active') refreshHome();});
    return () => {mounted = false; subscription.remove();};
  }, []);

  const focusValue = focusMinutes === null ? '—' : focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` : `${focusMinutes}m`;
  const screenTimeValue = todayUsage?.permissionGranted ? formatUsageTime(todayUsage.totalTimeMs) : '—';
  const topApps = todayUsage?.permissionGranted ? todayUsage.topApps : [];
  const needsUsageAccess = todayUsage?.permissionGranted === false;
  const usageFailed = usageLoaded && todayUsage === null;
  const energyScore = todayUsage?.permissionGranted && focusMinutes !== null
    ? Math.max(0, Math.min(100, Math.round(100 - todayUsage.totalTimeMs / 300000 + focusMinutes / 2)))
    : null;
  const energyMessage = energyScore === null
    ? needsUsageAccess ? '✦  Connect usage' : usageFailed ? '✦  Unavailable' : '✦  Checking in…'
    : energyScore >= 80 ? '✦  Looking good!' : energyScore >= 50 ? '✦  Keep it going!' : '✦  Take a breather';
  const offendersLabel = needsUsageAccess ? 'Enable Usage Access' : 'Open blocked apps';
  function openEnergyInfo() {
    if (needsUsageAccess && blocker?.openUsageAccessSettings) {
      blocker.openUsageAccessSettings().catch(() => Alert.alert('Usage Access', 'Open Android Settings and allow Usage Access for Chewy.'));
      return;
    }
    Alert.alert('Chewy energy', 'Your day starts at 100%. Every 5 minutes of app time uses 1 point. Every 2 minutes of completed Focus restores 1 point, up to 100%.');
  }
  function openOffenders() {
    if (needsUsageAccess && blocker?.openUsageAccessSettings) {
      blocker.openUsageAccessSettings().catch(() => open('Block'));
    } else {
      open('Block');
    }
  }
  return <Animated.ScrollView style={styles.homeScreen} contentContainerStyle={styles.scroll} onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: true})} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
    <Animated.View pointerEvents="none" style={[styles.homeBackdrop, {opacity: scrollY.interpolate({inputRange: [160, 230], outputRange: [1, 0], extrapolate: 'clamp'})}]}>
      <Image source={require('../assets/ChatGPT Image Oct 1, 2026 at 01_43_21 AM.png')} style={styles.homeBackdropImage} resizeMode="cover" />
      <Svg width="100%" height={160} style={styles.homeBackdropFade}>
        <Defs><LinearGradient id="homePhotoFade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={homeGround} stopOpacity={0} /><Stop offset="1" stopColor={homeGround} /></LinearGradient></Defs>
        <Rect width="100%" height="100%" fill="url(#homePhotoFade)" />
      </Svg>
    </Animated.View>
    <View style={styles.homeBody}>
    <View style={styles.homeHeader}><Text style={styles.brandTitle}>Chewy</Text><Pressable style={styles.streak} onPress={() => open('Progress')} accessibilityRole="button" accessibilityLabel={`${streak} day streak, open progress`}><Text style={styles.streakText}>🔥 {streak}</Text></Pressable></View>
    <View style={styles.homeScene}>
      <View style={styles.heroArt}><ChewyCharacter size={190} expression={energyScore !== null && energyScore < 50 ? 'calm' : 'happy'} /></View>
    </View>
    <View style={styles.energySummary}>
      <View style={styles.heroScoreRow}><Text style={styles.heroScore}>{energyScore ?? '—'}{energyScore !== null && <Text style={styles.heroPercent}>%</Text>}</Text><Pressable onPress={openEnergyInfo} accessibilityRole="button" accessibilityLabel="About Chewy energy"><Text style={styles.heroScoreNote}>{energyMessage}</Text></Pressable></View>
      <View style={styles.heroTrack} accessibilityRole="progressbar" accessibilityLabel="Chewy energy" accessibilityValue={energyScore === null ? undefined : {min: 0, max: 100, now: energyScore}}>{energyScore !== null && energyScore > 0 && <View style={[styles.heroTrackFill, {width: `${energyScore}%`}]}><Text style={styles.heroTrackStar}>✦</Text></View>}</View>
    </View>
    <View style={styles.metricRow}>
      <View style={[styles.metric, styles.screenMetric]}><Text style={styles.metricDoodle}>✦</Text><View style={styles.metricIconBadge}><ContentIcon name="phone" color={colors.green} /></View><Text style={styles.metricValue}>{screenTimeValue}</Text><Text style={styles.metricLabel}>Screen time</Text></View>
      <View style={[styles.metric, styles.focusMetric]}><Text style={styles.metricDoodle}>✿</Text><View style={styles.metricIconBadge}><ContentIcon name="sparkles" color={colors.green} /></View><Text style={styles.metricValue}>{focusValue}</Text><Text style={styles.metricLabel}>Focus time</Text></View>
      <View style={[styles.metric, styles.pickupMetric]}><Text style={styles.metricDoodle}>✦</Text><View style={styles.metricIconBadge}><ContentIcon name="pickups" color={colors.green} /></View><Text style={styles.metricValue}>—</Text><Text style={styles.metricLabel}>Pickups</Text></View>
    </View>
    <View style={styles.offendersHeading}><Text style={styles.sectionTitle}>Top offenders</Text></View>
    <Pressable style={[styles.offendersCard, topApps.length > 0 && styles.offendersAppsCard]} onPress={openOffenders} accessibilityRole="button" accessibilityLabel={offendersLabel}>
      {topApps.length ? <View style={styles.topAppsList}>{topApps.map((app, index) => <View key={app.packageName} style={[styles.topAppRow, index > 0 && styles.topAppDivider]}>
        <View style={styles.appIconBadge}>{app.icon ? <Image source={{uri: app.icon}} style={styles.appIcon} /> : <ContentIcon name="phone" color={colors.background} />}</View>
        <Text style={styles.topAppName} numberOfLines={1}>{app.label}</Text>
        <Text style={styles.topAppTime}>{formatUsageTime(app.timeMs)}</Text>
      </View>)}</View> : <><View style={styles.offendersIcon}><ContentIcon name="phone" color={colors.green} /><Text style={styles.sleepZ}>zZ</Text></View><View style={styles.offendersCopy}><Text style={styles.offendersTitle}>{needsUsageAccess ? 'See where your time goes' : 'All quiet for now!'}</Text><Text style={styles.smallMuted}>{needsUsageAccess ? 'Allow Usage Access to see your screen time and most used apps. Tap to set it up.' : usageFailed ? 'Couldn’t read app usage. Try reopening Chewy.' : usageLoaded ? 'No app usage to show today.' : 'Checking today’s app usage…'}</Text></View><ContentIcon name="chevron" color={colors.green} /></>}
    </Pressable>
    <Text style={styles.sectionTitle}>Make a little space</Text>
    <Pressable style={[styles.action, styles.focusAction]} onPress={() => open('Focus')} accessibilityRole="button" accessibilityLabel="Take a focus break"><View style={styles.actionIconBadge}><ContentIcon name="break" color={colors.green} /></View><View style={styles.actionCopy}><Text style={styles.actionKicker}>A QUIET MOMENT</Text><Text style={styles.actionTitle}>Take a focus break</Text><Text style={styles.actionDetail}>Give your mind a moment to breathe</Text></View><View style={styles.actionArrow}><ContentIcon name="chevron" color={colors.green} /></View></Pressable>
    <Pressable style={[styles.action, styles.boundaryAction]} onPress={() => open('Block')} accessibilityRole="button" accessibilityLabel="Plan your boundaries"><View style={styles.actionIconBadge}><ContentIcon name="hand" color={colors.green} /></View><View style={styles.actionCopy}><Text style={styles.actionKicker}>YOUR CHOICE</Text><Text style={styles.actionTitle}>Plan your boundaries</Text><Text style={styles.actionDetail}>Try a self-guided pause</Text></View><View style={styles.actionArrow}><ContentIcon name="chevron" color={colors.green} /></View></Pressable>
    </View>
  </Animated.ScrollView>;
}

function formatUsageTime(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60000);
  if (milliseconds > 0 && minutes === 0) return '<1m';
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background}, homeBackground: {backgroundColor: 'transparent'}, homeDockBackground: {backgroundColor: 'transparent'}, focusBackground: {backgroundColor: colors.focusBackground}, progressBackground: {backgroundColor: colors.progressBackground}, content: {flex: 1}, persistentBlock: {flex: 1}, hiddenBlock: {display: 'none'},
  homeScreen: {flex: 1, backgroundColor: homeGround}, scroll: {paddingTop: 20, paddingBottom: 36, flexGrow: 1}, homeBody: {paddingHorizontal: 20, gap: 17},
  homeBackdrop: {position: 'absolute', top: 0, left: 0, right: 0, height: 520, overflow: 'hidden'},
  homeBackdropImage: {width: '100%', height: 700},
  homeBackdropFade: {position: 'absolute', bottom: 0, left: 0, right: 0},
  brandTitle: {fontSize: 38, lineHeight: 45, fontWeight: '900', letterSpacing: -1.4, color: colors.green, textShadowColor: cartoon.sunshine, textShadowOffset: {width: 2, height: 3}, textShadowRadius: 0, transform: [{rotate: '-2deg'}]},
  homeHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10}, streak: {backgroundColor: '#fff0aa', borderWidth: 2, borderColor: colors.green, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, shadowColor: colors.green, shadowOpacity: 0.16, shadowRadius: 4, shadowOffset: {width: 0, height: 3}, elevation: 2}, streakText: {fontSize: 14, fontWeight: '800', color: colors.green},
  homeScene: {paddingTop: 8}, heroArt: {height: 215, alignItems: 'center', justifyContent: 'flex-end'},
  energySummary: {paddingHorizontal: 4, gap: 9}, heroScoreRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, heroScore: {fontSize: 50, lineHeight: 55, fontWeight: '900', color: colors.background}, heroPercent: {fontSize: 24, fontWeight: '800'}, heroScoreNote: {fontSize: 11, fontWeight: '800', color: colors.green, backgroundColor: '#fff0aa', borderRadius: 15, paddingHorizontal: 11, paddingVertical: 7, overflow: 'hidden'}, heroTrack: {height: 20, borderRadius: 12, borderWidth: 2, borderColor: '#e0f9d4', backgroundColor: '#e0f9d4', overflow: 'hidden'}, heroTrackFill: {height: '100%', borderRadius: 10, backgroundColor: '#008a53', alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4}, heroTrackStar: {fontSize: 12, lineHeight: 14, color: colors.background}, heroFooter: {fontSize: 12, color: colors.muted},
  smallMuted: {fontSize: 12, lineHeight: 18, color: colors.muted},
  metricRow: {flexDirection: 'row', gap: 9}, metric: {flex: 1, borderRadius: 22, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 10, minHeight: 150, justifyContent: 'space-between', overflow: 'hidden'}, screenMetric: {backgroundColor: '#ffe4cd'}, focusMetric: {backgroundColor: '#cef3da'}, pickupMetric: {backgroundColor: '#e4dcff'}, metricDoodle: {position: 'absolute', top: 6, right: 9, fontSize: 20, fontWeight: '800', color: '#81bbaa'}, metricIconBadge: {width: 37, height: 37, borderRadius: 12, borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', transform: [{rotate: '-6deg'}]}, metricValue: {fontSize: 21, fontWeight: '900', color: colors.ink}, metricLabel: {fontSize: 12, fontWeight: '800', color: colors.ink}, metricNote: {fontSize: 10, fontWeight: '700', color: colors.muted},
  offendersHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3}, offendersPeriod: {fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.green, backgroundColor: '#fff0aa', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden'}, offendersCard: {borderRadius: 23, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: colors.surface, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12}, offendersAppsCard: {backgroundColor: '#0c8b58', borderWidth: 0, borderBottomWidth: 0, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10}, offendersIcon: {width: 50, height: 50, borderRadius: 17, backgroundColor: '#d4f3e3', borderWidth: 1.5, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', transform: [{rotate: '-8deg'}]}, sleepZ: {position: 'absolute', top: -8, right: -6, fontSize: 14, fontWeight: '900', color: colors.green}, offendersCopy: {flex: 1, gap: 3}, offendersTitle: {fontSize: 15, fontWeight: '800', color: colors.ink}, topAppsList: {flex: 1}, topAppRow: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7}, topAppDivider: {marginTop: 2}, appIconBadge: {width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}, appIcon: {width: 32, height: 32}, topAppName: {flex: 1, fontSize: 14, fontWeight: '800', color: colors.background}, topAppTime: {fontSize: 12, fontWeight: '800', color: colors.background},
  sectionTitle: {fontSize: 20, fontWeight: '900', color: colors.background}, action: {minHeight: 102, borderRadius: 23, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12}, focusAction: {backgroundColor: cartoon.mint}, boundaryAction: {backgroundColor: cartoon.peach}, actionIconBadge: {width: 53, height: 53, borderRadius: 18, borderWidth: 2, borderColor: colors.green, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', transform: [{rotate: '-7deg'}]}, actionCopy: {flex: 1}, actionKicker: {fontSize: 9, fontWeight: '900', letterSpacing: 1.1, color: colors.green, marginBottom: 3}, actionTitle: {fontSize: 15, fontWeight: '900', color: colors.ink}, actionDetail: {fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 2}, actionArrow: {width: 33, height: 33, borderRadius: 17, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.sunshine, alignItems: 'center', justifyContent: 'center'},
  tabDock: {backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 8},
  tabBar: {height: 76, borderRadius: 40, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.green, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3},
  tab: {flex: 1, height: 70, borderRadius: 38, alignItems: 'center', justifyContent: 'center'},
  tabSelection: {position: 'absolute', borderRadius: 38, backgroundColor: cartoon.sunshine, borderWidth: 2, borderColor: colors.background},
  tabIconWrap: {width: 25, height: 25},
  tabDarkIcon: {position: 'absolute', top: 0, left: 0},
  status: {fontSize: 14, fontWeight: '700', color: colors.green}, secondary: {height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center'}, secondaryText: {color: colors.green, fontWeight: '800'},
});
