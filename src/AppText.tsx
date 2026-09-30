import React from 'react';
import {Platform, StyleSheet, Text as NativeText} from 'react-native';
import type {TextProps} from 'react-native';

export const appFontFamily = Platform.select({ios: 'Plus Jakarta Sans', android: 'PlusJakartaSans'}) ?? 'Plus Jakarta Sans';

const styles = StyleSheet.create({text: {fontFamily: appFontFamily}});

export function Text({style, ...props}: TextProps) {
  return <NativeText {...props} style={[styles.text, style]} />;
}
