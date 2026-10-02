import React from 'react';
import Svg, {Circle, Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import {themePalettes, type ThemeMode} from './theme';

export function ThemeLandscape({mode}: {mode: Exclude<ThemeMode, 'day'>}) {
  const palette = themePalettes[mode];
  return <Svg width="100%" height={700} viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
    <Defs><LinearGradient id={`landscapeSky-${mode}`} x1="0" y1="0" x2="0" y2="1">
      <Stop stopColor={palette.sky} />
      <Stop offset="1" stopColor={mode === 'evening' ? '#ffe2a0' : mode === 'forest' ? '#cef2db' : '#8487a9'} />
    </LinearGradient></Defs>
    <Rect width={390} height={700} fill={`url(#landscapeSky-${mode})`} />

    {mode === 'evening' && <>
      <Circle cx={302} cy={178} r={46} fill="#fff1ac" />
      <Path d="M25 176c12-17 29-20 44-8 17-15 35-6 40 9 14-4 25 3 29 13H25c-9-2-9-10 0-14Z" fill="#ffe0c9" opacity={0.8} />
      <Path d="M0 365c62-29 105-21 156-38 65-22 110-13 170 5 23 7 45 14 64 26v342H0Z" fill="#e9b777" />
      <Path d="M0 432c72-23 120-9 185-20 69-12 144-4 205 21v267H0Z" fill="#d7a06d" />
      <Path d="M34 357c22-27 54-28 80 0H34Z" fill="#f47d59" stroke="#c95e56" strokeWidth={2} />
      <Path d="M74 357v82" stroke="#8b5955" strokeWidth={4} strokeLinecap="round" />
      <Path d="M48 350c18-9 35-8 52 1" stroke="#ffb285" strokeWidth={3} strokeLinecap="round" />
      <Path d="m300 433 7-10 8 8-15 2Zm24 16 7-7 5 8-12-1Z" fill="#fff2ce" />
      <Path d="M0 493c96-16 145-8 220-20 71-12 121-7 170 8v219H0Z" fill={palette.ground} />
    </>}

    {mode === 'forest' && <>
      <Circle cx={313} cy={115} r={35} fill="#fff3b2" />
      <Path d="M34 157c9-16 23-19 37-10 12-11 27-4 29 8 11-3 23 4 24 14H34c-10-1-10-8 0-12Z" fill="#fffdf0" opacity={0.85} />
      <Path d="M0 364c76-55 140-20 212-47 77-30 133-4 178 25v358H0Z" fill="#8ed2ad" />
      <Path d="M0 438c83-32 137-20 206-40 73-21 134-8 184 22v280H0Z" fill="#5fbc9d" />
      <Rect x={22} y={310} width={13} height={173} rx={6} fill="#477d69" />
      <Circle cx={28} cy={314} r={49} fill="#279c79" /><Circle cx={2} cy={341} r={40} fill="#1d8b70" /><Circle cx={63} cy={341} r={36} fill="#43b88d" />
      <Rect x={351} y={302} width={12} height={182} rx={6} fill="#477d69" />
      <Circle cx={357} cy={305} r={48} fill="#248c72" /><Circle cx={384} cy={337} r={39} fill="#1c806b" /><Circle cx={324} cy={337} r={34} fill="#3aac88" />
      <Path d="M0 505c92-36 146-17 215-33 65-15 123-2 175 18v210H0Z" fill={palette.ground} />
      <Path d="M70 510c-7-13 0-23 9-20 5 2 7 8 7 13 7-10 16-10 19-3 3 7-2 15-13 17m193-14c-5-12 1-20 9-18 5 2 8 7 8 12 7-9 15-8 18-2 3 7-3 13-12 15" fill="#116b5d" />
    </>}

    {mode === 'night' && <>
      <Circle cx={299} cy={133} r={39} fill="#fff1bf" /><Circle cx={315} cy={118} r={39} fill={palette.sky} />
      <Path d="m38 104 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Zm117 60 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Zm209 61 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" fill="#fff3b5" />
      <Path d="M0 387h34V308h37v40h35V280h41v74h34V313h43v49h36V286h42v53h30V311h58v389H0Z" fill="#5c6a8c" />
      <Path d="M0 431h51v-65h45v22h33v-72h43v77h43v-37h48v52h36v-82h41v74h50v300H0Z" fill="#414f72" />
      <Path d="M16 341h7m0 22h7m91-56h8m0 22h8m67 12h8m82-29h8m0 26h8m55-8h8" stroke="#f9dba9" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      <Path d="M0 487c100-20 173-5 239-14 60-8 108-1 151 8v219H0Z" fill={palette.ground} />
      <Path d="M0 525h390" stroke="#a8a0a0" strokeWidth={5} opacity={0.5} />
    </>}
  </Svg>;
}
