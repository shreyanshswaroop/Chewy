import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Modal, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import Svg, {Circle, Ellipse, Path, Rect} from 'react-native-svg';
import {Text, appFontFamily} from './AppText';
import {ChewyCharacter} from './ChewyCharacter';
import {blocker} from './native/blocker';
import {FOCUS_DURATION_KEY, LONG_BREAK_KEY, SHORT_BREAK_KEY, timerOptions, loadTimerSettings} from './focusSettings';
import {collectExpiredFocusSession} from './progress';
import type {TimerMode} from './progress';
import {cartoon, colors, themePalettes, type ThemeMode} from './theme';

const END_KEY = 'chewy.focusEndsAt';
const ACTIVE_DURATION_KEY = 'chewy.activeFocusDuration';
const PAUSED_KEY = 'chewy.focusPausedSeconds';
const MODE_KEY = 'chewy.focusMode';
const TASK_KEY = 'chewy.focusTask';

function FocusScene({mode, minutes}: {mode: TimerMode; minutes: number}) {
  const isBreak = mode !== 'focus';
  return <View style={styles.scene} accessibilityLabel={isBreak ? `${minutes} minute break illustration` : `${minutes} minute focus illustration`}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 330 230">
      <Path d="m38 51 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm250 6 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill={cartoon.sunshine} />
      <Circle cx={42} cy={151} r={7} fill={cartoon.peach} /><Circle cx={289} cy={153} r={8} fill={cartoon.lilac} />
      <Ellipse cx={165} cy={200} rx={117} ry={20} fill="#f3ead2" />
      <Circle cx={165} cy={107} r={91} fill={isBreak ? '#f7e8d9' : '#e5f3e8'} />
      {!isBreak && minutes <= 20 && <>
        <Path d="M75 193C43 166 41 124 66 110c25 17 29 50 9 83ZM255 193c32-27 34-69 9-83-25 17-29 50-9 83Z" fill="#96cda7" />
        <Circle cx={66} cy={64} r={6} fill="#b8dfc7" /><Circle cx={272} cy={81} r={9} fill="#b8dfc7" />
      </>}
      {!isBreak && minutes > 50 && <>
        <Path d="m68 75 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm198-27 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#efb95f" />
        <Circle cx={83} cy={143} r={4} fill="#efb95f" /><Circle cx={254} cy={119} r={5} fill="#efb95f" />
      </>}
      {isBreak && minutes >= 10 && minutes < 15 && <>
        <Path d="M83 68v28a8 8 0 1 1-5-7V62l19-5v28a8 8 0 1 1-5-7V62l-9 2ZM250 51v21a7 7 0 1 1-4-6V47l16-4v21a7 7 0 1 1-4-6V47l-8 2Z" fill="#79b6a4" />
      </>}
      {isBreak && minutes >= 15 && <>
        <Path d="M75 55a27 27 0 1 0 36 36A31 31 0 0 1 75 55Z" fill="#eebf70" />
        <Path d="m259 74 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#eebf70" />
      </>}
    </Svg>
    <View style={styles.mascot}><ChewyCharacter size={156} expression={isBreak ? 'calm' : 'happy'} /></View>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 330 230">
      {!isBreak && minutes > 20 && minutes <= 35 && <>
        <Path d="M85 171q38-13 80 3 42-16 80-3v46q-39-14-80 2-41-16-80-2Z" fill="#fffef4" stroke={colors.green} strokeWidth={3} />
        <Path d="M165 174v45M94 182q28-7 58 2m26 0q28-9 58-2" fill="none" stroke="#88bca4" strokeWidth={2} />
        <Path d="M183 178v26l7-5 7 5v-29" fill="#f3ad8c" />
      </>}
      {!isBreak && minutes > 35 && minutes <= 50 && <>
        <Rect x={96} y={166} width={138} height={50} rx={7} fill="#aaa0de" stroke="#6c699e" strokeWidth={2} />
        <Path d="M82 217h166l-9 8H91Z" fill="#7774a8" />
        <Circle cx={165} cy={190} r={6} fill="#f4e9ff" />
      </>}
      {!isBreak && minutes > 50 && <>
        <Path d="M107 112c0-54 25-79 58-79s58 25 58 79" fill="none" stroke={colors.green} strokeWidth={10} strokeLinecap="round" />
        <Rect x={100} y={106} width={20} height={44} rx={10} fill="#f0b979" /><Rect x={210} y={106} width={20} height={44} rx={10} fill="#f0b979" />
      </>}
      {isBreak && minutes < 10 && <>
        <Rect x={202} y={163} width={53} height={44} rx={8} fill="#f3b783" stroke="#bd8359" strokeWidth={2} />
        <Path d="M254 169q22 0 18 16t-18 13M215 156q-9-12 0-25m16 25q-9-12 0-25" fill="none" stroke="#bd8359" strokeWidth={3} strokeLinecap="round" />
      </>}
      {isBreak && minutes >= 15 && <>
        <Path d="M86 214q79-25 158 0" fill="none" stroke="#9dc3ac" strokeWidth={12} strokeLinecap="round" />
      </>}
    </Svg>
  </View>;
}

function TimerControlIcon({name}: {name: 'skip' | 'play' | 'pause' | 'reset'}) {
  return <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    {name === 'skip' && <><Path d="M7 8.5c0-1.7 1.8-2.6 3.2-1.7l14 9c1.3.9 1.3 2.5 0 3.4l-14 9C8.8 29.1 7 28.2 7 26.5Z" stroke="#83a69a" strokeWidth={2} strokeLinejoin="round" /><Path d="M28 7v22" stroke="#83a69a" strokeWidth={2.2} strokeLinecap="round" /></>}
    {name === 'play' && <Path d="M8 7.6C8 5.7 10 4.7 11.6 5.7l17 10.4c1.5.9 1.5 2.9 0 3.8l-17 10.4C10 31.3 8 30.3 8 28.4Z" fill={colors.green} />}
    {name === 'pause' && <><Rect x={9} y={7} width={6} height={22} rx={2} fill={colors.green} /><Rect x={21} y={7} width={6} height={22} rx={2} fill={colors.green} /></>}
    {name === 'reset' && <><Path d="M10 10a12 12 0 1 1-3.5 8.5" stroke="#83a69a" strokeWidth={2.2} strokeLinecap="round" /><Path d="M11 3 5 10l7 5" stroke="#83a69a" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></>}
  </Svg>;
}

function TimerControlButton({name, label, onPress}: {name: 'skip' | 'play' | 'pause' | 'reset'; label: string; onPress: () => void | Promise<void>}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const previousName = useRef(name);

  useEffect(() => {
    if (previousName.current === name) return;
    previousName.current = name;
    reveal.setValue(0.55);
    Animated.spring(reveal, {toValue: 1, friction: 7, tension: 180, useNativeDriver: true}).start();
  }, [name, reveal]);

  function handlePress() {
    if (name === 'reset') {
      rotation.setValue(0);
      Animated.timing(rotation, {toValue: 1, duration: 360, useNativeDriver: true}).start();
    }
    onPress();
  }

  return <Pressable style={styles.timerControl} onPress={handlePress} onPressIn={() => Animated.spring(scale, {toValue: 0.88, friction: 7, tension: 210, useNativeDriver: true}).start()} onPressOut={() => Animated.spring(scale, {toValue: 1, friction: 6, tension: 180, useNativeDriver: true}).start()} accessibilityRole="button" accessibilityLabel={label}>
    <Animated.View style={[styles.timerControlIcon, {transform: [{scale}]}]}>
      <Animated.View style={{opacity: reveal, transform: [{scale: reveal}, {rotate: rotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-360deg']})}]}}><TimerControlIcon name={name} /></Animated.View>
    </Animated.View>
  </Pressable>;
}

function PlusIcon() {
  return <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4v16M4 12h16" stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>;
}

export function FocusScreen({theme = 'day'}: {theme?: ThemeMode}) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [duration, setDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(10);
  const [longBreakDuration, setLongBreakDuration] = useState(30);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedSeconds, setPausedSeconds] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [task, setTask] = useState('');
  const [taskDraft, setTaskDraft] = useState('');
  const [taskDone, setTaskDone] = useState(false);
  const [taskEditor, setTaskEditor] = useState(false);
  const [focusShieldActive, setFocusShieldActive] = useState(false);
  const [focusReady, setFocusReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    blocker?.getStatus().then(status => {
      if (mounted) setFocusReady(status.accessibilityEnabled && status.blockedPackages.length > 0);
    }).catch(() => {});
    collectExpiredFocusSession().then(() => Promise.all([loadTimerSettings(), ...[END_KEY, PAUSED_KEY, MODE_KEY, TASK_KEY].map(key => AsyncStorage.getItem(key))])).then(([settings, end, paused, savedMode, savedTask]) => {
      if (!mounted) return;
      if (end && Number(end) > Date.now()) {
        setEndsAt(Number(end));
        const nativeBlocker = blocker;
        if (savedMode === 'focus' && nativeBlocker) {
          nativeBlocker.getStatus().then(status => {
            if (status.accessibilityEnabled && status.blockedPackages.length > 0) {
              return nativeBlocker.setFocusBlockUntil(Number(end)).then(() => { if (mounted) setFocusShieldActive(true); });
            }
          }).catch(() => {});
        }
      }
      setDuration(settings.focus);
      setShortBreakDuration(settings.shortBreak);
      setLongBreakDuration(settings.longBreak);
      if (paused && Number(paused) > 0) setPausedSeconds(Number(paused));
      if (savedMode === 'focus' || savedMode === 'shortBreak' || savedMode === 'longBreak') setMode(savedMode);
      else if (savedMode === 'break') setMode('shortBreak');
      if (savedTask) setTask(savedTask);
    });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const selectedMinutes = mode === 'focus' ? duration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
  const sessionSeconds = selectedMinutes * 60;
  const seconds = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : pausedSeconds ?? sessionSeconds;
  const running = endsAt !== null && seconds > 0;
  const paused = pausedSeconds !== null && !running;
  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const artworkTitle = mode === 'longBreak' ? 'Long break · Rest and recharge'
    : mode === 'shortBreak' ? selectedMinutes < 10 ? 'Short break · Take a little sip' : selectedMinutes < 15 ? 'Short break · Let your mind wander' : 'Short break · Rest and recharge'
    : duration <= 20 ? 'Breathe into focus' : duration <= 35 ? 'One page at a time' : duration <= 50 ? 'Make room to create' : 'Settle in for deep work';

  useEffect(() => {
    if (endsAt && endsAt <= now) {
      collectExpiredFocusSession().then(nextMode => {
        setEndsAt(null);
        setPausedSeconds(null);
        setFocusShieldActive(false);
        if (nextMode) setMode(nextMode);
      });
    }
  }, [endsAt, now]);

  async function startOrResume() {
    const end = Date.now() + (pausedSeconds ?? sessionSeconds) * 1000;
    if (pausedSeconds === null && mode === 'focus') {
      await AsyncStorage.setItem(ACTIVE_DURATION_KEY, String(duration));
    }
    setNow(Date.now());
    setEndsAt(end);
    setPausedSeconds(null);
    await Promise.all([AsyncStorage.setItem(END_KEY, String(end)), AsyncStorage.setItem(MODE_KEY, mode), AsyncStorage.removeItem(PAUSED_KEY)]);
    if (blocker && mode === 'focus') {
      try {
        const status = await blocker.getStatus();
        setFocusReady(status.accessibilityEnabled && status.blockedPackages.length > 0);
        if (status.accessibilityEnabled && status.blockedPackages.length > 0) {
          await blocker.setFocusBlockUntil(end);
          setFocusShieldActive(true);
        } else setFocusShieldActive(false);
      } catch { setFocusShieldActive(false); }
    }
  }

  async function pauseSession() {
    setPausedSeconds(seconds);
    setEndsAt(null);
    await Promise.all([AsyncStorage.setItem(PAUSED_KEY, String(seconds)), AsyncStorage.removeItem(END_KEY)]);
    if (blocker) await blocker.setFocusBlockUntil(0);
    setFocusShieldActive(false);
  }

  async function finishSession() {
    if (mode === 'focus' && endsAt && endsAt <= Date.now()) {
      const nextMode = await collectExpiredFocusSession();
      if (nextMode) setMode(nextMode);
    }
    setEndsAt(null);
    setPausedSeconds(null);
    await Promise.all([AsyncStorage.removeItem(END_KEY), AsyncStorage.removeItem(PAUSED_KEY), AsyncStorage.removeItem(ACTIVE_DURATION_KEY)]);
    if (blocker) await blocker.setFocusBlockUntil(0);
    setFocusShieldActive(false);
  }

  async function changeMode(next: TimerMode) {
    if (next === mode) return;
    await finishSession();
    setMode(next);
    await AsyncStorage.setItem(MODE_KEY, next);
  }

  function cycleDuration() {
    if (running || paused) return;
    const options: readonly number[] = timerOptions[mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'shortBreak' : 'longBreak'];
    const current = selectedMinutes;
    const next = options[(options.indexOf(current) + 1) % options.length];
    if (mode === 'focus') {
      setDuration(next);
      AsyncStorage.setItem(FOCUS_DURATION_KEY, String(next));
    } else if (mode === 'shortBreak') {
      setShortBreakDuration(next);
      AsyncStorage.setItem(SHORT_BREAK_KEY, String(next));
    } else {
      setLongBreakDuration(next);
      AsyncStorage.setItem(LONG_BREAK_KEY, String(next));
    }
  }

  async function skipToNext() {
    await changeMode(mode === 'focus' ? 'shortBreak' : 'focus');
  }

  function saveTask() {
    const next = taskDraft.trim();
    setTask(next);
    setTaskDone(false);
    setTaskEditor(false);
    if (next) AsyncStorage.setItem(TASK_KEY, next);
    else AsyncStorage.removeItem(TASK_KEY);
  }

  return <View style={[styles.screen, {backgroundColor: themePalettes[theme].focus}]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FocusScene mode={mode} minutes={selectedMinutes} />
      <Text style={styles.artworkTitle}>{artworkTitle}</Text>
      <Pressable style={styles.timeWrap} onPress={cycleDuration} accessibilityRole="button" accessibilityLabel={running ? `${timeText} remaining` : `${timeText}, tap to change duration`}><Text style={styles.timerText}>{timeText}</Text><View style={styles.timerUnderline} />{!running && !paused && <Text style={styles.timeHint}>Tap time to change</Text>}{paused && <Text style={styles.timeHint}>Paused</Text>}</Pressable>
      {blocker && mode === 'focus' && <Text style={styles.shieldHint}>{focusShieldActive && running ? 'Your selected apps are paused until Focus ends.' : focusReady ? 'Starting Focus will pause your selected apps.' : 'To pause apps during Focus, select them in Block and enable Chewy’s Android service.'}</Text>}
      <View style={styles.controls}>
        <TimerControlButton name="skip" onPress={skipToNext} label={mode === 'focus' ? 'Skip to break' : 'Skip to focus'} />
        <TimerControlButton name={running ? 'pause' : 'play'} onPress={running ? pauseSession : startOrResume} label={running ? 'Pause timer' : paused ? 'Resume timer' : 'Start timer'} />
        <TimerControlButton name="reset" onPress={finishSession} label="Reset timer" />
      </View>
      <Pressable style={styles.taskCard} onPress={() => { if (task) setTaskDone(value => !value); else { setTaskDraft(''); setTaskEditor(true); } }} accessibilityRole="button"><View style={styles.taskIcon}><CircleTask done={taskDone} /></View><View style={styles.taskCopy}><Text style={styles.taskTitle}>{task || 'One small thing at a time'}</Text><Text style={styles.taskHint}>{task ? taskDone ? 'Done for now' : 'Tap when finished' : 'Add a task for this session'}</Text></View></Pressable>
      <Pressable style={styles.addTask} onPress={() => {setTaskDraft(task); setTaskEditor(true);}} accessibilityRole="button"><View style={styles.plusCircle}><PlusIcon /></View><Text style={styles.addTaskText}>Add task</Text></Pressable>
      <Pressable style={styles.modeLink} onPress={skipToNext} accessibilityRole="button"><Text style={styles.modeLinkText}>{mode === 'focus' ? 'Take a break instead' : 'Back to focus'}</Text></Pressable>
    </ScrollView>
    <Modal visible={taskEditor} transparent animationType="fade" onRequestClose={() => setTaskEditor(false)}><View style={styles.modalShade}><View style={styles.editor}><Text style={styles.editorTitle}>Your focus task</Text><TextInput style={styles.taskInput} value={taskDraft} onChangeText={setTaskDraft} placeholder="What would you like to focus on?" placeholderTextColor={colors.muted} autoFocus returnKeyType="done" onSubmitEditing={saveTask} /><View style={styles.editorActions}><Pressable onPress={() => setTaskEditor(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable style={styles.saveButton} onPress={saveTask}><Text style={styles.saveText}>Save task</Text></Pressable></View></View></View></Modal>
  </View>;
}

function CircleTask({done}: {done: boolean}) {
  return <Svg width={42} height={42} viewBox="0 0 42 42" fill="none"><Circle cx={21} cy={21} r={17} stroke="#73b992" strokeWidth={2.2} strokeDasharray="4 5" /><Ellipse cx={21} cy={23} rx={9} ry={8} fill={done ? '#b4e2c9' : '#ffd4b4'} opacity={done ? 0.45 : 0.7} /><Path d={done ? 'm13 21 5 5 11-12' : 'M21 8c3 2 4 5 3 8m-3-8c-3 2-4 5-3 8M21 8V5'} stroke={colors.green} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.focusBackground}, content: {paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30},
  scene: {height: 205, marginTop: 36, alignItems: 'center', overflow: 'hidden'}, mascot: {position: 'absolute', top: 27, alignSelf: 'center'}, artworkTitle: {fontSize: 15, fontWeight: '800', color: colors.green, textAlign: 'center', alignSelf: 'center', marginTop: 4, backgroundColor: cartoon.sunshine, borderWidth: 1.5, borderColor: colors.green, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, overflow: 'hidden'},
  timeWrap: {alignItems: 'center', justifyContent: 'center', minHeight: 137, marginTop: 5}, timerText: {fontSize: 71, fontWeight: '900', color: colors.green, fontVariant: ['tabular-nums']}, timerUnderline: {width: 126, height: 7, borderRadius: 5, backgroundColor: cartoon.sunshine, marginTop: -8, marginBottom: 9}, timeHint: {fontSize: 12, fontWeight: '700', color: colors.muted},
  shieldHint: {alignSelf: 'center', maxWidth: 290, marginTop: 8, fontSize: 12, lineHeight: 18, fontWeight: '700', color: colors.muted, textAlign: 'center'},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 28}, timerControl: {width: 62, height: 62, alignItems: 'center', justifyContent: 'center'}, timerControlIcon: {width: 56, height: 56, alignItems: 'center', justifyContent: 'center'},
  taskCard: {marginTop: 27, minHeight: 86, borderRadius: 25, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: cartoon.mint, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12}, taskIcon: {width: 45, alignItems: 'center'}, taskCopy: {flex: 1}, taskTitle: {fontSize: 15, fontWeight: '800', color: colors.ink}, taskHint: {fontSize: 12, color: colors.muted, marginTop: 4},
  addTask: {height: 58, marginTop: 12, borderRadius: 25, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.green, backgroundColor: cartoon.sunshine, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12}, plusCircle: {width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'}, addTaskText: {fontSize: 18, fontWeight: '800', color: colors.green},
  modeLink: {alignSelf: 'center', padding: 12, marginTop: 12}, modeLinkText: {fontSize: 13, fontWeight: '700', color: colors.green},
  modalShade: {flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17,48,40,0.45)'}, editor: {backgroundColor: colors.surface, borderRadius: 25, borderWidth: 2, borderColor: colors.green, padding: 22, gap: 18}, editorTitle: {fontSize: 20, fontWeight: '800', color: colors.ink}, taskInput: {height: 52, borderWidth: 1.5, borderColor: colors.green, borderRadius: 14, paddingHorizontal: 14, color: colors.ink, fontFamily: appFontFamily}, editorActions: {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 24}, cancelText: {fontSize: 14, fontWeight: '700', color: colors.muted}, saveButton: {backgroundColor: cartoon.sunshine, borderWidth: 1.5, borderColor: colors.green, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 18}, saveText: {fontSize: 14, fontWeight: '800', color: colors.green},
});
