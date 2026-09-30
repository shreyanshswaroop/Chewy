import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, View} from 'react-native';
import Svg, {Circle, Defs, Ellipse, LinearGradient, Path, Stop} from 'react-native-svg';

export type Expression = 'happy' | 'calm' | 'curious' | 'worried' | 'tired';

export function ChewyCharacter({
  expression = 'happy',
  size = 190,
}: {
  expression?: Expression;
  size?: number;
}) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (reduceMotion) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, {toValue: -5, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
          Animated.timing(float, {toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [float]);

  const face = expression === 'curious'
    ? <Ellipse cx="100" cy="124" rx="5" ry="7" fill="#643c58" />
    : expression === 'worried' || expression === 'tired'
      ? <Path d="M83 130 Q100 111 117 130" stroke="#643c58" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <><Path d="M81 119 Q100 145 119 119" stroke="#643c58" strokeWidth="4.5" strokeLinecap="round" fill="none" /><Path d="M93 133 Q100 130 107 133" stroke="#e46588" strokeWidth="2" strokeLinecap="round" fill="none" /></>;
  const eyes = expression === 'calm'
    ? <><Path d="M82 109 Q89 116 96 109 M104 109 Q111 116 118 109" stroke="#643c58" strokeWidth="4" strokeLinecap="round" fill="none" /></>
    : expression === 'tired'
      ? <><Path d="M83 110 H94 M106 110 H117" stroke="#643c58" strokeWidth="4" strokeLinecap="round" /></>
      : <><Ellipse cx="88" cy="108" rx="5" ry="7" fill="#643c58" /><Ellipse cx="112" cy="108" rx="5" ry="7" fill="#643c58" /><Circle cx="89" cy="105" r="1.5" fill="white" /><Circle cx="113" cy="105" r="1.5" fill="white" /></>;

  return (
    <View accessibilityLabel={`Chewy looks ${expression}`} accessible>
      <Animated.View style={{transform: [{translateY: float}]}}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="brain" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ffd4dc" />
              <Stop offset="0.55" stopColor="#ff9fba" />
              <Stop offset="1" stopColor="#f377a0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="100" cy="185" rx="57" ry="6" fill="#005e50" opacity="0.18" />
          <Path d="M58 137 Q34 157 20 141 M142 137 Q166 157 180 141" stroke="#a35070" strokeWidth="7" strokeLinecap="round" fill="none" />
          <Circle cx="19" cy="140" r="6" fill="#ffc2d0" stroke="#a35070" strokeWidth="2" />
          <Circle cx="181" cy="140" r="6" fill="#ffc2d0" stroke="#a35070" strokeWidth="2" />
          <Path d="M72 152 66 177 M128 152 134 177" stroke="#a35070" strokeWidth="8" strokeLinecap="round" />
          <Path d="M52 179 Q61 170 75 178 Q80 183 75 187 H52 Q47 185 52 179Z M125 178 Q139 170 148 179 Q153 185 148 187 H125 Q120 183 125 178Z" fill="#fff4df" stroke="#a35070" strokeWidth="2.5" />
          <Path d="M100 160 C78 168 54 164 44 152 C26 154 13 143 20 126 C11 113 13 101 24 94 C18 78 28 71 40 73 C41 59 54 52 64 56 C74 39 88 37 98 50 C111 37 124 39 130 54 C143 52 154 60 157 74 C172 74 180 84 177 99 C189 107 187 120 179 129 C186 144 173 158 156 153 C145 164 121 167 100 160 Z" fill="url(#brain)" stroke="#fff8ee" strokeWidth="4" strokeLinejoin="round" />
          <Path d="M99 49 C91 63 105 76 100 94 M53 79 C50 66 60 61 74 67 M37 109 C51 99 62 110 60 125 M124 67 C139 60 151 69 148 83 M141 123 C146 108 160 105 171 114" fill="none" stroke="#ec7198" strokeWidth="3.5" strokeLinecap="round" opacity="0.58" />
          <Path d="M61 62 Q70 55 78 58 M115 52 Q124 45 133 55 M31 93 Q35 87 43 87" fill="none" stroke="#ffe6e7" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <Ellipse cx="73" cy="121" rx="8" ry="6" fill="#f46d99" opacity="0.58" />
          <Ellipse cx="127" cy="121" rx="8" ry="6" fill="#f46d99" opacity="0.58" />
          {eyes}{face}
        </Svg>
      </Animated.View>
    </View>
  );
}
