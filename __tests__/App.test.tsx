/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AccessibilityInfo} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import App from '../App';
import {Onboarding} from '../src/Onboarding';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

beforeEach(() => jest.clearAllMocks());

test('renders correctly', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => renderer.unmount());
});

test('opens Chewy after the third onboarding page without a theme screen', async () => {
  const reduceMotion = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const onComplete = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SafeAreaProvider initialMetrics={{frame: {x: 0, y: 0, width: 390, height: 844}, insets: {top: 0, right: 0, bottom: 0, left: 0}}}><Onboarding onComplete={onComplete} /></SafeAreaProvider>);
  });
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({accessibilityLabel: 'Get started'}).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({accessibilityLabel: 'Next'}).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({accessibilityLabel: 'Open Chewy'}).props.onPress();
  });
  expect(onComplete).toHaveBeenCalledWith();
  expect(renderer.root.findAllByProps({accessibilityLabel: 'App theme'})).toHaveLength(0);
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Opening Chewy'}).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(() => renderer.unmount());
  reduceMotion.mockRestore();
});
