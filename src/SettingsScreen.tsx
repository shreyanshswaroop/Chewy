import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Animated, AppState, PanResponder, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {Text} from './AppText';
import {defaultTimerSettings, loadTimerSettings, timerKeys, timerOptions} from './focusSettings';
import type {TimerSetting, TimerSettings} from './focusSettings';
import {blocker, emptyStatus} from './native/blocker';
import type {BlockerStatus} from './native/blocker';
import {clearFocusRecords, collectExpiredFocusSession} from './progress';
import {cartoon, colors} from './theme';

type IconName = TimerSetting | 'apps' | 'service' | 'replay' | 'clear';

function SettingIcon({name}: {name: IconName}) {
  const stroke = {stroke: colors.green, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    {name === 'focus' && <><Circle cx={12} cy={13} r={8} {...stroke} /><Path d="M12 8v5l3 2M9 2h6M12 2v3" {...stroke} /></>}
    {name === 'shortBreak' && <><Path d="M4 9h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Zm13 2h2a2 2 0 0 1 0 4h-2M7 3v3m5-3v3" {...stroke} /></>}
    {name === 'longBreak' && <><Path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14M6 9h3m-3 3h3m6-3h3m-3 3h3" {...stroke} /></>}
    {name === 'sessions' && <><Circle cx={12} cy={12} r={9} {...stroke} /><Path d="M17 9a5.5 5.5 0 0 0-9-1l-1 2m0-3v3h3m-3 5a5.5 5.5 0 0 0 9 1l1-2m0 3v-3h-3" {...stroke} /></>}
    {name === 'apps' && <><Rect x={3} y={3} width={7} height={7} rx={2} {...stroke} /><Rect x={14} y={3} width={7} height={7} rx={2} {...stroke} /><Rect x={3} y={14} width={7} height={7} rx={2} {...stroke} /><Rect x={14} y={14} width={7} height={7} rx={2} {...stroke} /></>}
    {name === 'service' && <><Path d="M12 2 20 5v6c0 5-3.2 8.2-8 11-4.8-2.8-8-6-8-11V5l8-3Z" {...stroke} /><Path d="m9 12 2 2 4-4" {...stroke} /></>}
    {name === 'replay' && <><Path d="M4 11a8 8 0 1 1 2.4 6M4 5v6h6" {...stroke} /></>}
    {name === 'clear' && <><Path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6" {...stroke} /></>}
  </Svg>;
}

function ChevronIcon({direction}: {direction: 'down' | 'right'}) {
  return <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d={direction === 'down' ? 'm4.5 7.5 5.5 5 5.5-5' : 'm7.5 4.5 5 5.5-5 5.5'} stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

const timerLabels: Record<TimerSetting, string> = {
  focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break', sessions: 'Sessions',
};

const timerHints: Record<TimerSetting, string> = {
  focus: 'Length of each new Focus session',
  shortBreak: 'A quick pause after Focus',
  longBreak: 'A longer pause after your session goal',
  sessions: 'Focus sessions before a long break',
};

function TimerSettingCard({kind, value, expanded, onToggle, onChange}: {kind: TimerSetting; value: number; expanded: boolean; onToggle: () => void; onChange: (value: number) => void}) {
  const options: readonly number[] = timerOptions[kind];
  const [draft, setDraft] = useState(value);
  const position = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const widthRef = useRef(1);
  const startXRef = useRef(0);
  const draftRef = useRef(value);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const draggingRef = useRef(false);
  valueRef.current = value;
  onChangeRef.current = onChange;

  function clamp(x: number) { return Math.max(0, Math.min(widthRef.current, x)); }
  function nearest(x: number) {
    const index = Math.round(clamp(x) / widthRef.current * (options.length - 1));
    return options[index];
  }
  function preview(x: number) {
    const selected = nearest(x);
    position.setValue(clamp(x));
    if (selected !== draftRef.current) {draftRef.current = selected; setDraft(selected);}
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => {
      draggingRef.current = true;
      position.stopAnimation();
      startXRef.current = clamp(event.nativeEvent.locationX);
      preview(startXRef.current);
    },
    onPanResponderMove: (_event, gesture) => preview(startXRef.current + gesture.dx),
    onPanResponderRelease: (_event, gesture) => {
      const selected = nearest(startXRef.current + gesture.dx);
      draggingRef.current = false;
      draftRef.current = selected;
      setDraft(selected);
      Animated.spring(position, {toValue: options.indexOf(selected) / (options.length - 1) * widthRef.current, friction: 10, tension: 160, useNativeDriver: false}).start();
      if (selected !== valueRef.current) onChangeRef.current(selected);
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false;
      draftRef.current = valueRef.current;
      setDraft(valueRef.current);
      Animated.spring(position, {toValue: options.indexOf(valueRef.current) / (options.length - 1) * widthRef.current, friction: 10, tension: 160, useNativeDriver: false}).start();
    },
  })).current;

  useEffect(() => {
    Animated.timing(arrow, {toValue: expanded ? 1 : 0, duration: 180, useNativeDriver: true}).start();
  }, [arrow, expanded]);

  useEffect(() => {
    if (draggingRef.current) return;
    draftRef.current = value;
    setDraft(value);
    Animated.timing(position, {toValue: options.indexOf(value) / (options.length - 1) * widthRef.current, duration: 180, useNativeDriver: false}).start();
  }, [options, position, value]);

  return <View style={styles.timerCard}>
    <Pressable style={styles.timerRow} onPress={onToggle} accessibilityRole="button" accessibilityState={{expanded}} accessibilityLabel={`${timerLabels[kind]}, ${value}${kind === 'sessions' ? ' sessions' : ' minutes'}`}>
      <View style={styles.timerIconBadge}><SettingIcon name={kind} /></View>
      <Text style={styles.timerName}>{timerLabels[kind]}</Text>
      <Text style={styles.timerValue}>{expanded ? draft : value}{kind === 'sessions' ? '' : 'm'}</Text>
      <Animated.View style={{transform: [{rotate: arrow.interpolate({inputRange: [0, 1], outputRange: ['0deg', '180deg']})}]}}><ChevronIcon direction="down" /></Animated.View>
    </Pressable>
    {expanded && <View style={styles.sliderArea}>
      <Text style={styles.sliderHint}>{timerHints[kind]}</Text>
      <View style={styles.sliderTouch} onLayout={event => {widthRef.current = event.nativeEvent.layout.width; position.setValue(options.indexOf(valueRef.current) / (options.length - 1) * widthRef.current);}} accessibilityRole="adjustable" accessibilityValue={{min: options[0], max: options[options.length - 1], now: draft}} {...panResponder.panHandlers}>
        <View pointerEvents="none" style={styles.sliderTrack}><Animated.View style={[styles.sliderFill, {width: position}]} /><Animated.View style={[styles.sliderThumb, {left: position}]} /></View>
      </View>
      <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>{options[0]}{kind === 'sessions' ? '' : 'm'}</Text><Text style={styles.sliderLabel}>{options[options.length - 1]}{kind === 'sessions' ? '' : 'm'}</Text></View>
    </View>}
  </View>;
}

function SettingsRow({icon, title, detail, value, onPress, destructive = false}: {icon: IconName; title: string; detail?: string; value?: string; onPress: () => void; destructive?: boolean}) {
  return <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}>
    <View style={styles.iconBadge}><SettingIcon name={icon} /></View>
    <View style={styles.rowCopy}><Text style={[styles.rowTitle, destructive && styles.destructive]}>{title}</Text>{detail && <Text style={styles.rowDetail}>{detail}</Text>}</View>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    <ChevronIcon direction="right" />
  </Pressable>;
}

export function SettingsScreen({onReplay, onOpenBlock}: {onReplay: () => void; onOpenBlock: () => void}) {
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(defaultTimerSettings);
  const [status, setStatus] = useState<BlockerStatus>(emptyStatus);
  const [expandedTimer, setExpandedTimer] = useState<TimerSetting | null>('focus');

  const refresh = useCallback(async () => {
    try {
      const [savedSettings, nextStatus] = await Promise.all([
        loadTimerSettings(),
        blocker ? blocker.getStatus() : Promise.resolve(emptyStatus),
      ]);
      setTimerSettings(savedSettings);
      setStatus(nextStatus);
    } catch (reason) { Alert.alert('Could not load settings', String(reason)); }
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', state => {if (state === 'active') refresh();});
    return () => subscription.remove();
  }, [refresh]);

  async function chooseTimerValue(kind: TimerSetting, value: number) {
    const previous = timerSettings[kind];
    setTimerSettings(current => ({...current, [kind]: value}));
    try {
      await AsyncStorage.setItem(timerKeys[kind], String(value));
    } catch (reason) {
      setTimerSettings(current => ({...current, [kind]: previous}));
      Alert.alert('Could not save timer setting', String(reason));
    }
  }

  function confirmClearProgress() {
    Alert.alert('Clear progress history?', 'This removes completed Focus sessions and app pause counts from this device. Your blocked app list and current timer stay in place.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear history', style: 'destructive', onPress: async () => {
        try {
          await collectExpiredFocusSession();
          await clearFocusRecords();
          if (blocker?.clearPauseEvents) await blocker.clearPauseEvents();
          Alert.alert('History cleared', 'Your progress will start again from zero.');
        } catch (reason) { Alert.alert('Could not clear history', String(reason)); }
      }},
    ]);
  }

  function confirmReplay() {
    Alert.alert('Replay onboarding?', 'You can revisit the welcome flow. Your Focus and Block settings will stay saved.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Replay', onPress: onReplay},
    ]);
  }

  return <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.sectionCaption}>Edit time</Text>
      {(['focus', 'shortBreak', 'longBreak', 'sessions'] as TimerSetting[]).map(kind => <TimerSettingCard key={kind} kind={kind} value={timerSettings[kind]} expanded={expandedTimer === kind} onToggle={() => setExpandedTimer(current => current === kind ? null : kind)} onChange={value => chooseTimerValue(kind, value)} />)}

      <Text style={styles.sectionTitle}>General</Text>
      <Text style={styles.sectionSubhead}>App boundaries</Text>
      <View style={styles.sectionCard}><SettingsRow icon="apps" title="Manage blocked apps" detail="Choose what Chewy pauses" value={blocker ? `${status.blockedPackages.length} selected` : 'Android only'} onPress={onOpenBlock} /><View style={styles.divider} /><SettingsRow icon="service" title="Android service" detail="Needed for app pause screens" value={blocker ? status.accessibilityEnabled ? 'Enabled' : 'Off' : 'Unavailable'} onPress={() => blocker?.openAccessibilitySettings()} /></View>
      <View style={styles.statusCard}><View style={[styles.statusDot, status.blockingEnabled && status.accessibilityEnabled && styles.statusDotOn]} /><Text style={styles.statusText}>{blocker ? status.blockingEnabled && status.accessibilityEnabled ? 'App boundaries are active' : 'App boundaries are currently off' : 'App boundaries are available on Android'}</Text></View>

      <Text style={styles.sectionTitle}>Your Chewy</Text>
      <View style={styles.sectionCard}><SettingsRow icon="replay" title="Replay onboarding" detail="See the welcome flow again" onPress={confirmReplay} /><View style={styles.divider} /><SettingsRow icon="clear" title="Clear progress history" detail="Remove saved sessions and pause counts" onPress={confirmClearProgress} destructive /></View>

      <View style={styles.privacyCard}><Text style={styles.privacyTitle}>Privacy & control</Text><Text style={styles.privacyBody}>Your chosen apps, Focus history, and pause counts are stored on this device. Chewy’s Android service reads the foreground app’s package name to show your pause screen.</Text></View>
    </ScrollView>

  </>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background}, content: {paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40, gap: 13}, eyebrow: {fontSize: 12, fontWeight: '800', letterSpacing: 2.2, color: colors.green}, heading: {fontSize: 31, fontWeight: '900', color: colors.ink, marginBottom: 6}, sectionCaption: {alignSelf: 'flex-start', fontSize: 13, fontWeight: '800', color: colors.green, backgroundColor: cartoon.sunshine, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 5, overflow: 'hidden', marginBottom: 3},
  timerCard: {borderWidth: 2, borderBottomWidth: 4, borderColor: colors.green, borderRadius: 24, backgroundColor: colors.surface, overflow: 'hidden'}, timerRow: {height: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12}, timerIconBadge: {width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.mint, alignItems: 'center', justifyContent: 'center'}, timerName: {flex: 1, fontSize: 15, fontWeight: '800', color: colors.ink}, timerValue: {fontSize: 14, fontWeight: '800', color: colors.green},
  sliderArea: {paddingHorizontal: 20, paddingBottom: 17}, sliderHint: {fontSize: 11, color: colors.muted, marginBottom: 4}, sliderTouch: {height: 46, justifyContent: 'center'}, sliderTrack: {height: 14, borderRadius: 8, backgroundColor: '#dcefe5'}, sliderFill: {height: 14, borderRadius: 8, backgroundColor: '#21ad81'}, sliderThumb: {position: 'absolute', top: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: cartoon.sunshine, borderWidth: 3, borderColor: colors.green, transform: [{translateX: -13}]}, sliderLabels: {flexDirection: 'row', justifyContent: 'space-between'}, sliderLabel: {fontSize: 11, color: colors.muted},
  sectionSubhead: {fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 5},
  sectionTitle: {fontSize: 19, fontWeight: '900', color: colors.ink, marginTop: 10}, sectionCard: {borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, borderRadius: 24, backgroundColor: colors.surface, paddingHorizontal: 14, overflow: 'hidden'}, row: {minHeight: 73, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10}, iconBadge: {width: 42, height: 42, borderRadius: 15, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.mint, alignItems: 'center', justifyContent: 'center'}, rowCopy: {flex: 1}, rowTitle: {fontSize: 14, fontWeight: '800', color: colors.ink}, destructive: {color: '#b65352'}, rowDetail: {fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 3}, rowValue: {fontSize: 11, fontWeight: '800', color: colors.green, textAlign: 'right'}, divider: {height: 1.5, backgroundColor: '#cce5d9', marginLeft: 54},
  statusCard: {backgroundColor: cartoon.sunshine, borderWidth: 2, borderColor: colors.green, borderRadius: 24, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 15}, statusDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#a2aaa5'}, statusDotOn: {backgroundColor: colors.green}, statusText: {fontSize: 12, fontWeight: '800', color: colors.ink},
  privacyCard: {backgroundColor: cartoon.lilac, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, borderRadius: 24, padding: 18, gap: 8, marginTop: 5}, privacyTitle: {fontSize: 15, fontWeight: '900', color: colors.ink}, privacyBody: {fontSize: 12, lineHeight: 19, color: colors.ink},
});
