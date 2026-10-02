import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Text} from './AppText';
import {colors, themeOptions, themePalettes, type ThemeMode} from './theme';

export function CompactThemePicker({value, onChange}: {value: ThemeMode; onChange: (mode: ThemeMode) => void}) {
  return <View style={styles.compactOptions} accessibilityRole="radiogroup" accessibilityLabel="App theme">
    {themeOptions.map(option => {
      const palette = themePalettes[option.mode];
      const selected = value === option.mode;
      return <Pressable key={option.mode} style={styles.compactOption} onPress={() => onChange(option.mode)} accessibilityRole="radio" accessibilityLabel={`${option.label} theme`} accessibilityState={{checked: selected}}>
        <View style={[styles.dotOuter, selected && {borderColor: palette.dock}]}>
          <View style={[styles.dotInner, {borderColor: palette.dock}]}>
            <View style={[styles.dotSky, {backgroundColor: palette.sky}]} />
            <View style={[styles.dotGround, {backgroundColor: palette.ground}]} />
            <View style={styles.dotSun} />
          </View>
        </View>
        <Text style={[styles.compactLabel, selected && styles.compactLabelSelected]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  compactOptions: {flexDirection: 'row', alignItems: 'flex-start', gap: 4, paddingVertical: 4},
  compactOption: {flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4},
  dotOuter: {width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center'},
  dotInner: {width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden'},
  dotSky: {flex: 1},
  dotGround: {height: 16},
  dotSun: {position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff0aa'},
  compactLabel: {fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'center'},
  compactLabelSelected: {fontWeight: '900'},
});
