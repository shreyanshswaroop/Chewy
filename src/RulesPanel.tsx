import React, {useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {Text, appFontFamily} from './AppText';
import {ACCESS_OPTIONS, ALLOWANCE_OPTIONS, formatRuleDays, formatRuleTime, parseRuleTime, WEEKDAY_LABELS} from './blockRules';
import type {BlockRules, ScheduleRule} from './blockRules';
import {cartoon, colors} from './theme';

type Props = {rules: BlockRules; busy: boolean; usageAccessGranted: boolean; onSave: (rules: BlockRules) => Promise<boolean>; onOpenUsageAccess: () => void};

export function RulesPanel({rules, busy, usageAccessGranted, onSave, onOpenUsageAccess}: Props) {
  const [editing, setEditing] = useState<ScheduleRule | null>(null);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('21:00');
  const [end, setEnd] = useState('07:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [open, setOpen] = useState(false);

  function edit(rule?: ScheduleRule) {
    setEditing(rule ?? null);
    setTitle(rule?.title ?? 'Evening boundary');
    setStart(formatRuleTime(rule?.start ?? 21 * 60));
    setEnd(formatRuleTime(rule?.end ?? 7 * 60));
    setDays(rule?.days ?? [0, 1, 2, 3, 4, 5, 6]);
    setOpen(true);
  }

  async function saveSchedule() {
    const startMinute = parseRuleTime(start);
    const endMinute = parseRuleTime(end);
    if (!title.trim() || title.trim().length > 40 || startMinute === null || endMinute === null || startMinute === endMinute || days.length === 0) {
      Alert.alert('Check your schedule', 'Add a name, at least one day, and different start and end times in 24-hour HH:MM format.');
      return;
    }
    const rule = {id: editing?.id ?? String(Date.now()), title: title.trim(), days: [...days].sort(), start: startMinute, end: endMinute};
    const schedules = editing ? rules.schedules.map(item => item.id === editing.id ? rule : item) : [...rules.schedules, rule];
    if (await onSave({...rules, schedules})) setOpen(false);
  }

  return <>
    <View style={styles.card}>
      <Text style={styles.heading}>Daily allowance</Text>
      <Text style={styles.hint}>Pause selected apps after their combined time reaches this limit each day.</Text>
      <View style={styles.choices}>{ALLOWANCE_OPTIONS.map(minutes => <Pressable key={minutes} disabled={busy} onPress={() => onSave({...rules, dailyAllowanceMinutes: minutes})} style={[styles.choice, rules.dailyAllowanceMinutes === minutes && styles.selected]} accessibilityRole="radio" accessibilityState={{selected: rules.dailyAllowanceMinutes === minutes}}><Text style={[styles.choiceText, rules.dailyAllowanceMinutes === minutes && styles.selectedText]}>{minutes === 0 ? 'Off' : minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}</Text></Pressable>)}</View>
      {rules.dailyAllowanceMinutes > 0 && !usageAccessGranted && <Pressable onPress={onOpenUsageAccess} accessibilityRole="button"><Text style={styles.link}>Allow Usage Access to enforce this limit →</Text></Pressable>}
    </View>

    <View style={styles.card}>
      <Text style={styles.heading}>Schedules</Text>
      <Text style={styles.hint}>Pause selected apps at the times you choose. Overnight schedules end the next day.</Text>
      {rules.schedules.map(rule => <View key={rule.id} style={styles.ruleRow}><Pressable style={styles.ruleCopy} onPress={() => edit(rule)} accessibilityRole="button" accessibilityLabel={`Edit ${rule.title}`}><Text style={styles.ruleTitle}>{rule.title}</Text><Text style={styles.hint}>{formatRuleDays(rule.days)} · {formatRuleTime(rule.start)}–{formatRuleTime(rule.end)}</Text></Pressable><Pressable disabled={busy} onPress={() => onSave({...rules, schedules: rules.schedules.filter(item => item.id !== rule.id)})} accessibilityRole="button" accessibilityLabel={`Remove ${rule.title}`}><Text style={styles.remove}>Remove</Text></Pressable></View>)}
      <Pressable style={styles.add} disabled={busy || rules.schedules.length >= 5} onPress={() => edit()} accessibilityRole="button"><Text style={styles.addText}>{rules.schedules.length >= 5 ? 'Five schedules maximum' : '+ Add schedule'}</Text></Pressable>
    </View>

    <View style={styles.card}>
      <Text style={styles.heading}>Intentional access</Text>
      <Text style={styles.hint}>Offer this much time when the pause screen appears.</Text>
      <View style={styles.choices}>{ACCESS_OPTIONS.map(minutes => <Pressable key={minutes} disabled={busy} onPress={() => onSave({...rules, accessWindowMinutes: minutes})} style={[styles.choice, rules.accessWindowMinutes === minutes && styles.selected]} accessibilityRole="radio" accessibilityState={{selected: rules.accessWindowMinutes === minutes}}><Text style={[styles.choiceText, rules.accessWindowMinutes === minutes && styles.selectedText]}>{minutes === 0 ? 'Off' : `${minutes}m`}</Text></Pressable>)}</View>
      <Text style={styles.hint}>Off removes the temporary access button.</Text>
    </View>

    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><ScrollView style={styles.editorScreen} contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled"><View style={styles.editorHeading}><Text style={styles.editorTitle}>{editing ? 'Edit schedule' : 'New schedule'}</Text><Pressable onPress={() => setOpen(false)} accessibilityRole="button"><Text style={styles.link}>Cancel</Text></Pressable></View>
      <Text style={styles.fieldLabel}>Name</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={40} placeholder="Evening boundary" placeholderTextColor={colors.muted} />
      <View style={styles.timeRow}><View style={styles.timeField}><Text style={styles.fieldLabel}>Start</Text><TextInput style={styles.input} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" placeholder="21:00" placeholderTextColor={colors.muted} maxLength={5} /></View><View style={styles.timeField}><Text style={styles.fieldLabel}>End</Text><TextInput style={styles.input} value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" placeholder="07:00" placeholderTextColor={colors.muted} maxLength={5} /></View></View>
      <Text style={styles.fieldLabel}>Repeats on</Text><View style={styles.choices}>{WEEKDAY_LABELS.map((label, day) => <Pressable key={day} onPress={() => setDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])} style={[styles.dayChoice, days.includes(day) && styles.selected]} accessibilityRole="checkbox" accessibilityState={{checked: days.includes(day)}}><Text style={[styles.choiceText, days.includes(day) && styles.selectedText]}>{label}</Text></Pressable>)}</View>
      <Pressable style={styles.save} onPress={saveSchedule} disabled={busy} accessibilityRole="button"><Text style={styles.saveText}>Save schedule</Text></Pressable>
    </ScrollView></Modal>
  </>;
}

const styles = StyleSheet.create({
  card: {marginHorizontal: 20, borderRadius: 24, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: colors.surface, padding: 17, gap: 12},
  heading: {fontSize: 17, fontWeight: '900', color: colors.ink}, hint: {fontSize: 12, lineHeight: 18, color: colors.muted},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 8}, choice: {paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.mint}, selected: {backgroundColor: colors.green}, choiceText: {fontSize: 12, fontWeight: '800', color: colors.green}, selectedText: {color: 'white'},
  link: {fontSize: 12, fontWeight: '800', color: colors.green}, ruleRow: {flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: '#cce5d9', paddingTop: 12}, ruleCopy: {flex: 1, gap: 3}, ruleTitle: {fontSize: 14, fontWeight: '800', color: colors.ink}, remove: {fontSize: 12, fontWeight: '800', color: '#b65352'}, add: {paddingVertical: 11, borderRadius: 14, backgroundColor: cartoon.sunshine, alignItems: 'center'}, addText: {fontSize: 13, fontWeight: '800', color: colors.green},
  editorScreen: {flex: 1, backgroundColor: colors.background}, editorContent: {padding: 22, paddingTop: 38, paddingBottom: 50, gap: 15}, editorHeading: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, editorTitle: {fontSize: 27, fontWeight: '900', color: colors.ink}, fieldLabel: {fontSize: 14, fontWeight: '800', color: colors.ink}, input: {height: 51, borderWidth: 1.5, borderColor: colors.green, borderRadius: 15, backgroundColor: 'white', paddingHorizontal: 13, color: colors.ink, fontFamily: appFontFamily}, timeRow: {flexDirection: 'row', gap: 12}, timeField: {flex: 1, gap: 8}, dayChoice: {paddingHorizontal: 10, paddingVertical: 10, borderRadius: 13, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.mint}, save: {marginTop: 16, borderRadius: 18, paddingVertical: 17, backgroundColor: colors.green, alignItems: 'center'}, saveText: {fontSize: 15, fontWeight: '900', color: 'white'},
});
