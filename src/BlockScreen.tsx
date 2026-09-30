import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, ActivityIndicator, Alert, Animated, AppState, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import Svg, {Circle, Ellipse, G, Path} from 'react-native-svg';
import {Text, appFontFamily} from './AppText';
import {blocker, emptyStatus} from './native/blocker';
import type {BlockerStatus, LaunchableApp} from './native/blocker';
import {cartoon, colors} from './theme';

type AppFilter = 'all' | 'social' | 'video';

const filters: Record<Exclude<AppFilter, 'all'>, string[]> = {
  social: ['instagram', 'tiktok', 'snapchat', 'facebook', 'reddit', 'twitter', 'threads', 'discord', 'pinterest'],
  video: ['youtube', 'netflix', 'twitch', 'primevideo', 'disney', 'hotstar'],
};

function SelectionIcon({selected}: {selected: boolean}) {
  return <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Circle cx={14} cy={14} r={12} fill={selected ? colors.green : 'white'} stroke={colors.green} strokeWidth={1.8} />
    <Path d={selected ? 'm9 14 3.5 3.5 6.5-7' : 'M14 9v10m-5-5h10'} stroke={selected ? 'white' : colors.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

function AlarmClockBadge({active}: {active: boolean}) {
  const wobble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;
    if (active) {
      AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
        if (!mounted || reduceMotion) return;
        animation = Animated.loop(Animated.sequence([
          Animated.timing(wobble, {toValue: 1, duration: 170, useNativeDriver: true}),
          Animated.timing(wobble, {toValue: -1, duration: 260, useNativeDriver: true}),
          Animated.timing(wobble, {toValue: 0, duration: 170, useNativeDriver: true}),
          Animated.delay(1700),
        ]));
        animation.start();
      });
    } else {
      wobble.setValue(0);
    }
    return () => {mounted = false; animation?.stop();};
  }, [active, wobble]);

  return <View style={styles.clockBadge}><Animated.View style={{transform: [{rotate: wobble.interpolate({inputRange: [-1, 0, 1], outputRange: ['-8deg', '0deg', '8deg']})}]}}>
    <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
      <Path d="M8 11 4 16m34-5 4 5" stroke="#d85b70" strokeWidth={3.2} strokeLinecap="round" />
      <Circle cx={23} cy={24} r={15} fill="#ffb5bf" stroke="#d85b70" strokeWidth={2.4} />
      <Circle cx={23} cy={24} r={11} fill="#ffe0e3" stroke="#d85b70" strokeWidth={1.4} />
      <Path d="M23 17v8l5 3M15 38l-3 4m22-4 3 4" stroke="#9f3c55" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={23} cy={24} r={1.7} fill="#9f3c55" />
    </Svg>
  </Animated.View></View>;
}

function AppTile({app}: {app: LaunchableApp}) {
  return app.icon
    ? <Image source={{uri: app.icon}} style={styles.appIcon} resizeMode="contain" accessibilityLabel={`${app.label} icon`} />
    : <View style={styles.appTile}><Text style={styles.appTileText}>{app.label.slice(0, 1).toUpperCase()}</Text></View>;
}

function MiniChewy({x, y, scale = 0.48, happy = false}: {x: number; y: number; scale?: number; happy?: boolean}) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Path d="M48 151 42 168m105-17 10 17" stroke="#994d68" strokeWidth={7} strokeLinecap="round" />
    <Path d="M100 160 C78 168 54 164 44 152 C26 154 13 143 20 126 C11 113 13 101 24 94 C18 78 28 71 40 73 C41 59 54 52 64 56 C74 39 88 37 98 50 C111 37 124 39 130 54 C143 52 154 60 157 74 C172 74 180 84 177 99 C189 107 187 120 179 129 C186 144 173 158 156 153 C145 164 121 167 100 160 Z" fill="#ff9cb5" stroke="#fff8f0" strokeWidth={5} strokeLinejoin="round" />
    <Path d="M98 51c-5 12-3 21 0 31m-55 12c-14-7-25 0-26 11m41-42c-10-3-20 4-19 15m93-16c12-3 23 4 23 16m13 21c14-5 20 4 19 14M38 126c10-9 21-5 24 7m83-6c10-8 21-4 24 6" stroke="#ee7fa1" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    <Ellipse cx={67} cy={120} rx={10} ry={7} fill="#ff789e" opacity={0.65} />
    <Ellipse cx={133} cy={120} rx={10} ry={7} fill="#ff789e" opacity={0.65} />
    <Ellipse cx={88} cy={107} rx={4.5} ry={6.5} fill="#653950" />
    <Ellipse cx={112} cy={107} rx={4.5} ry={6.5} fill="#653950" />
    <Path d={happy ? 'M82 120 Q100 148 118 120' : 'M84 121 Q100 139 116 121'} stroke="#653950" strokeWidth={5} strokeLinecap="round" fill="none" />
  </G>;
}

function QuickPickArt({kind}: {kind: 'social' | 'video' | 'custom'}) {
  return <Svg width={130} height={116} viewBox="0 0 130 116" fill="none">
    <Ellipse cx={63} cy={104} rx={40} ry={4} fill={colors.green} opacity={0.12} />
    <MiniChewy x={8} y={0} scale={0.58} happy />
    <Circle cx={104} cy={86} r={17} fill={cartoon.sunshine} stroke={colors.green} strokeWidth={2.5} />
    {kind === 'social' && <>
      <Path d="M96 81h16v10h-10l-5 4v-4h-1z" fill="none" stroke={colors.green} strokeWidth={2.2} strokeLinejoin="round" />
      <Circle cx={101} cy={86} r={1} fill={colors.green} /><Circle cx={106} cy={86} r={1} fill={colors.green} />
    </>}
    {kind === 'video' && <Path d="m101 79 10 7-10 7V79Z" fill={colors.green} />}
    {kind === 'custom' && <Path d="M104 78v16m-8-8h16" stroke={colors.green} strokeWidth={3} strokeLinecap="round" />}
  </Svg>;
}

export function BlockScreen({visible = true}: {visible?: boolean}) {
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [status, setStatus] = useState<BlockerStatus>(emptyStatus);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AppFilter>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!blocker) return;
    try {
      const [nextApps, nextStatus] = await Promise.all([blocker.getLaunchableApps(), blocker.getStatus()]);
      setApps(nextApps);
      setStatus(nextStatus);
      setError('');
      setReady(true);
    } catch (reason) { setError(String(reason)); }
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => subscription.remove();
  }, [refresh]);

  async function togglePackage(packageName: string) {
    if (!blocker || busy) return;
    const next = status.blockedPackages.includes(packageName)
      ? status.blockedPackages.filter(item => item !== packageName)
      : [...status.blockedPackages, packageName];
    setBusy(true);
    try {
      await blocker.saveBlockedPackages(next);
      setStatus(current => ({...current, blockedPackages: next}));
    } catch (reason) { Alert.alert('Could not save your apps', String(reason)); }
    finally { setBusy(false); }
  }

  async function toggleEnabled(enabled: boolean) {
    if (!blocker || busy) return;
    if (enabled && !status.accessibilityEnabled) {
      Alert.alert('Enable Chewy app boundaries first', 'Open Android Accessibility settings and turn on “Chewy app boundaries”. Then return here.');
      return;
    }
    if (enabled && status.blockedPackages.length === 0) {
      Alert.alert('Choose an app first', 'Add at least one app to your list.');
      return;
    }
    setBusy(true);
    try {
      await blocker.setBlockingEnabled(enabled);
      setStatus(current => ({...current, blockingEnabled: enabled}));
    } catch (reason) { Alert.alert('Could not update blocking', String(reason)); }
    finally { setBusy(false); }
  }

  function openPicker(nextFilter: AppFilter = 'all') {
    setFilter(nextFilter);
    setSearch('');
    setPickerOpen(true);
  }

  const selectedApps = apps.filter(app => status.blockedPackages.includes(app.packageName));
  const shownSelectedApps = selectedApps.slice(0, selectedApps.length > 4 ? 3 : 4);
  const blockingNow = status.blockingEnabled && status.accessibilityEnabled;
  const filteredApps = apps.filter(app => {
    const name = `${app.label} ${app.packageName}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (filter === 'all' || filters[filter].some(term => name.includes(term)));
  }).sort((a, b) => Number(status.blockedPackages.includes(b.packageName)) - Number(status.blockedPackages.includes(a.packageName)) || a.label.localeCompare(b.label));

  if (blocker && !ready) return <View style={styles.loadingScreen}>
    {error ? <><Text style={styles.loadingTitle}>Couldn’t load your boundaries</Text><Pressable onPress={refresh} accessibilityRole="button"><Text style={styles.serviceLink}>Try again  →</Text></Pressable></> : <><ActivityIndicator color={colors.green} /><Text style={styles.loadingTitle}>Checking your boundaries…</Text></>}
  </View>;

  return <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR BOUNDARIES</Text><Text style={styles.title}>Block</Text></View><Pressable style={styles.addButton} onPress={() => openPicker()} accessibilityRole="button"><SelectionIcon selected={false} /><Text style={styles.addButtonText}>Add apps</Text></Pressable></View>

      <Text style={styles.sectionLabel}>Blocking now</Text>
      <View style={styles.blockCard}>
        <View style={styles.blockCardTop}>
          <AlarmClockBadge active={blockingNow && visible} />
          <View style={styles.blockCardCopy}><Text style={styles.blockCardTitle}>Chewy shield</Text><Text style={styles.blockCardSubtitle}>{blockingNow ? 'All day' : selectedApps.length ? 'Off for now' : 'Choose apps to begin'}</Text></View>
          <Pressable style={[styles.statePill, blockingNow && styles.activePill]} onPress={() => toggleEnabled(!blockingNow)} disabled={!blocker || busy} accessibilityRole="switch" accessibilityLabel="Block selected apps" accessibilityState={{checked: blockingNow, disabled: !blocker || busy}}>
            <View style={[styles.stateDot, blockingNow && styles.activeDot]} /><Text style={[styles.stateText, blockingNow && styles.activeText]}>{blockingNow ? 'Active' : 'Off'}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.selectedStrip} onPress={() => openPicker()} accessibilityRole="button" accessibilityLabel="Choose apps to pause"><Text style={styles.selectedStripLabel}>Apps to pause</Text><View style={styles.selectedTiles}>{shownSelectedApps.map(app => <AppTile key={app.packageName} app={app} />)}{selectedApps.length > 4 && <View style={styles.moreTile}><Text style={styles.moreTileText}>+{selectedApps.length - 3}</Text></View>}{selectedApps.length === 0 && <Text style={styles.selectAppsHint}>Choose apps  ›</Text>}</View></Pressable>
      </View>

      {!status.accessibilityEnabled && blocker && <View style={styles.serviceCard}><View style={styles.serviceIcon}><Text style={styles.serviceIconText}>✦</Text></View><View style={styles.serviceCopy}><Text style={styles.serviceTitle}>One step to start blocking</Text><Text style={styles.serviceBody}>Enable Chewy’s Android service to show your pause screen.</Text><Pressable onPress={() => blocker?.openAccessibilitySettings()} accessibilityRole="button"><Text style={styles.serviceLink}>Enable service  →</Text></Pressable></View></View>}
      {!blocker && <Text style={styles.notice}>App blocking is available in the Android build.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.sectionLabel}>Quick picks</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
        <Pressable style={[styles.preset, styles.socialPreset]} onPress={() => openPicker('social')} accessibilityRole="button"><View style={styles.presetArt}><QuickPickArt kind="social" /></View><Text style={styles.presetTitle}>Social reset</Text><Text style={styles.presetSubtitle}>Choose social apps</Text></Pressable>
        <Pressable style={[styles.preset, styles.videoPreset]} onPress={() => openPicker('video')} accessibilityRole="button"><View style={styles.presetArt}><QuickPickArt kind="video" /></View><Text style={styles.presetTitle}>Video break</Text><Text style={styles.presetSubtitle}>Choose video apps</Text></Pressable>
        <Pressable style={[styles.preset, styles.allPreset]} onPress={() => openPicker()} accessibilityRole="button"><View style={styles.presetArt}><QuickPickArt kind="custom" /></View><Text style={styles.presetTitle}>Make your own</Text><Text style={styles.presetSubtitle}>Pick any app</Text></Pressable>
      </ScrollView>

      <Text style={styles.sectionLabel}>Your list</Text>
      <Pressable style={styles.listCard} onPress={() => openPicker()} accessibilityRole="button"><View style={styles.listHeader}><View><Text style={styles.listTitle}>My paused apps</Text><Text style={styles.listSubtitle}>{selectedApps.length === 0 ? 'No apps added yet' : `${selectedApps.length} ${selectedApps.length === 1 ? 'app' : 'apps'} in your list`}</Text></View><View style={styles.editPill}><Text style={styles.editPillText}>{selectedApps.length ? 'Edit' : 'Add'}</Text></View></View><View style={styles.listTiles}>{selectedApps.length ? selectedApps.slice(0, 6).map(app => <AppTile key={app.packageName} app={app} />) : <Text style={styles.emptyHint}>Tap to choose the apps you want to pause.</Text>}</View></Pressable>
      <Text style={styles.privacyNote}>Your choices stay on this device. Chewy only checks which app is in the foreground.</Text>
    </ScrollView>

    <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
      <View style={styles.pickerScreen}><View style={styles.pickerHeader}><View><Text style={styles.eyebrow}>YOUR LIST</Text><Text style={styles.pickerTitle}>Choose apps</Text></View><Pressable style={styles.doneButton} onPress={() => setPickerOpen(false)} accessibilityRole="button"><Text style={styles.doneText}>Done</Text></Pressable></View>
        <Text style={styles.pickerHint}>Tap an app to add or remove it from your pause list.</Text>
        <View style={styles.filterRow}>{(['all', 'social', 'video'] as AppFilter[]).map(item => <Pressable key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'all' ? 'All apps' : item === 'social' ? 'Social' : 'Video'}</Text></Pressable>)}</View>
        <TextInput style={styles.search} placeholder="Search installed apps" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} autoCorrect={false} />
        <ScrollView style={styles.appList} contentContainerStyle={styles.appListContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {filteredApps.map(app => { const selected = status.blockedPackages.includes(app.packageName); return <Pressable key={app.packageName} style={styles.appRow} onPress={() => togglePackage(app.packageName)} disabled={busy} accessibilityRole="checkbox" accessibilityState={{checked: selected}}><AppTile app={app} /><View style={styles.appCopy}><Text style={styles.appName}>{app.label}</Text></View><SelectionIcon selected={selected} /></Pressable>; })}
          {filteredApps.length === 0 && <View style={styles.emptyResults}><Text style={styles.emptyResultsTitle}>No apps found here</Text><Text style={styles.emptyHint}>Try another search or view all installed apps.</Text><Pressable onPress={() => {setFilter('all'); setSearch('');}}><Text style={styles.serviceLink}>Show all apps  →</Text></Pressable></View>}
        </ScrollView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background}, content: {paddingTop: 22, paddingBottom: 36, gap: 17},
  loadingScreen: {flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24}, loadingTitle: {fontSize: 15, fontWeight: '800', color: colors.ink, textAlign: 'center'},
  header: {paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}, eyebrow: {fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.green, marginBottom: 4}, title: {fontSize: 34, fontWeight: '800', color: colors.ink},
  addButton: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingLeft: 8, paddingRight: 13, borderRadius: 25, borderWidth: 2, borderColor: colors.green, backgroundColor: cartoon.sunshine}, addButtonText: {fontSize: 13, fontWeight: '800', color: colors.green},
  sectionLabel: {fontSize: 18, fontWeight: '900', color: colors.ink, marginHorizontal: 22, marginTop: 5},
  blockCard: {marginHorizontal: 20, borderRadius: 28, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 13, backgroundColor: colors.surface, gap: 14},
  blockCardTop: {flexDirection: 'row', alignItems: 'center', gap: 11}, clockBadge: {width: 64, height: 64, borderRadius: 24, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.green, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center', transform: [{rotate: '-5deg'}]}, blockCardCopy: {flex: 1}, blockCardTitle: {fontSize: 16, fontWeight: '900', color: colors.ink}, blockCardSubtitle: {fontSize: 12, color: colors.muted, marginTop: 2},
  statePill: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 17, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.sunshine, paddingHorizontal: 10, paddingVertical: 7}, activePill: {backgroundColor: cartoon.mint}, stateDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#9aa6a3'}, activeDot: {backgroundColor: '#08aa69'}, stateText: {fontSize: 11, fontWeight: '900', color: colors.green}, activeText: {color: colors.green},
  selectedStrip: {minHeight: 55, backgroundColor: cartoon.mint, borderRadius: 19, borderWidth: 1.5, borderBottomWidth: 3, borderColor: colors.green, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5}, selectedStripLabel: {flexShrink: 1, fontSize: 12, fontWeight: '900', color: colors.green}, selectedTiles: {flexDirection: 'row', alignItems: 'center', gap: 5}, selectAppsHint: {fontSize: 12, fontWeight: '800', color: colors.green},
  appIcon: {width: 36, height: 36, borderRadius: 9}, appTile: {width: 36, height: 36, borderRadius: 11, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center'}, appTileText: {fontSize: 15, fontWeight: '800', color: colors.ink}, moreTile: {width: 36, height: 36, borderRadius: 11, backgroundColor: '#e8eaec', alignItems: 'center', justifyContent: 'center'}, moreTileText: {fontSize: 11, fontWeight: '800', color: colors.muted},
  serviceCard: {marginHorizontal: 20, flexDirection: 'row', gap: 12, borderRadius: 23, borderWidth: 2, borderColor: colors.green, backgroundColor: cartoon.mint, padding: 17}, serviceIcon: {width: 37, height: 37, borderRadius: 13, borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'}, serviceIconText: {fontSize: 20, color: colors.green}, serviceCopy: {flex: 1, gap: 5}, serviceTitle: {fontSize: 14, fontWeight: '800', color: colors.ink}, serviceBody: {fontSize: 12, lineHeight: 17, color: colors.muted}, serviceLink: {fontSize: 13, fontWeight: '800', color: colors.green, marginTop: 3},
  notice: {marginHorizontal: 22, fontSize: 13, color: colors.muted}, error: {marginHorizontal: 22, fontSize: 13, color: '#ba3746'},
  presetRow: {paddingHorizontal: 20, gap: 11}, preset: {width: 156, height: 179, borderRadius: 26, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 13, justifyContent: 'flex-end', overflow: 'hidden'}, socialPreset: {backgroundColor: cartoon.mint}, videoPreset: {backgroundColor: cartoon.peach}, allPreset: {backgroundColor: cartoon.lilac}, presetArt: {position: 'absolute', top: 7, alignSelf: 'center'}, presetTitle: {fontSize: 14, fontWeight: '900', textAlign: 'center', color: colors.ink}, presetSubtitle: {fontSize: 11, textAlign: 'center', color: colors.muted, marginTop: 3},
  listCard: {marginHorizontal: 20, borderRadius: 25, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: colors.surface, padding: 17, gap: 13}, listHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, listTitle: {fontSize: 15, fontWeight: '800', color: colors.ink}, listSubtitle: {fontSize: 12, color: colors.muted, marginTop: 3}, editPill: {paddingHorizontal: 15, paddingVertical: 7, backgroundColor: cartoon.sunshine, borderWidth: 1.5, borderColor: colors.green, borderRadius: 15}, editPillText: {fontSize: 12, fontWeight: '800', color: colors.green}, listTiles: {flexDirection: 'row', gap: 7, alignItems: 'center'}, emptyHint: {fontSize: 12, lineHeight: 18, color: colors.muted}, privacyNote: {marginHorizontal: 24, fontSize: 11, lineHeight: 17, color: colors.muted},
  pickerScreen: {flex: 1, backgroundColor: colors.background, paddingTop: 26}, pickerHeader: {paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, pickerTitle: {fontSize: 30, fontWeight: '800', color: colors.ink}, doneButton: {paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.green, borderRadius: 20}, doneText: {fontSize: 13, fontWeight: '800', color: 'white'}, pickerHint: {marginHorizontal: 22, marginTop: 10, fontSize: 13, color: colors.muted}, filterRow: {flexDirection: 'row', gap: 8, paddingHorizontal: 22, marginTop: 20}, filterChip: {borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#f2f2f4'}, filterChipActive: {backgroundColor: colors.mint}, filterText: {fontSize: 12, fontWeight: '700', color: '#777d82'}, filterTextActive: {color: colors.green},
  search: {marginHorizontal: 20, marginTop: 15, height: 49, borderRadius: 16, borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.ink, fontFamily: appFontFamily}, appList: {flex: 1, marginTop: 12}, appListContent: {paddingHorizontal: 20, paddingBottom: 40}, appRow: {height: 64, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1.5, borderColor: '#bddfd0', borderRadius: 18, backgroundColor: colors.surface, paddingHorizontal: 12, marginBottom: 8}, appCopy: {flex: 1}, appName: {fontSize: 15, fontWeight: '700', color: colors.ink}, emptyResults: {alignItems: 'center', padding: 28, gap: 10}, emptyResultsTitle: {fontSize: 16, fontWeight: '800', color: colors.ink},
});
