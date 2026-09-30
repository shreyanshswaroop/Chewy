import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {Text} from './AppText';
import {ChewyCharacter, Expression} from './ChewyCharacter';
import {cartoon, colors} from './theme';

type Page = {
  title: string;
  body: string;
  expression: Expression;
  options?: string[];
  multi?: boolean;
  kind?: 'hours' | 'hold' | 'processing';
};

const pages: Page[] = [
  {title: 'What would you like more of?', body: 'Choose the answer that feels closest.', expression: 'happy', options: ['Focus more easily', 'Scroll less without guilt', 'Sleep a little better', 'Be more present', 'Make time for projects', 'Just exploring']},
  {title: 'Where does screen time get in the way?', body: 'Choose all that feel familiar.', expression: 'worried', multi: true, options: ['Putting things off', 'Feeling overstimulated', 'Later bedtimes', 'Interrupted work or study', 'Less time with people', 'Feeling drained']},
  {title: 'What best describes your days?', body: 'Choose the answer that feels closest.', expression: 'curious', options: ['Creative or maker', 'Working professional', 'Building something', 'Student', 'Always on the move', 'Finding my balance']},
  {title: 'When is scrolling hardest to stop?', body: 'Choose the answer that feels closest.', expression: 'worried', options: ['Mornings', 'During the day', 'Evenings', 'Throughout the day', "I'm not sure yet"]},
  {title: 'Have you tried to cut back before?', body: 'Choose the answer that feels closest.', expression: 'happy', options: ["Yes, but it didn't last", 'Yes, and it helped for a while', 'No, this is my first try']},
  {title: 'Three useful reminders.', body: 'A pause creates a choice. Patterns are useful. Small wins count.', expression: 'happy'},
  {title: 'Which age range are you in?', body: 'This helps Chewy tailor the tone of your plan.', expression: 'curious', options: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+']},
  {title: 'About how much time do you spend on your phone each day?', body: 'Just an estimate is fine. No judgment here.', expression: 'calm', kind: 'hours'},
  {title: 'Putting your plan together…', body: 'Looking at your goal, your toughest moments, and a good first step.', expression: 'happy', kind: 'processing'},
  {title: 'A little room to reset.', body: 'Based on what you shared, a gentle boundary around your selected time could be a good place to start. This is a reflection of your answers, not a diagnosis.', expression: 'happy'},
  {title: 'Those hours add up.', body: 'At your estimate, that is about {days} full days of phone time in a year. Your actual usage may differ.', expression: 'worried'},
  {title: 'A small pause adds up, too.', body: 'A 30-minute daily change could return about 183 hours in a year. This is an illustration, not a promised result.', expression: 'happy'},
  {title: 'See the difference.', body: 'A picture of one week, based on your estimate. Even a small pause can make space.', expression: 'calm'},
  {title: 'Your time is still yours.', body: 'Small pauses can open up space for the things you care about.', expression: 'happy'},
  {title: 'More room for…', body: 'Learning, rest, people and play.', expression: 'curious'},
  {title: "It's easy to keep going.", body: 'Endless feeds can make stopping points hard to notice. A gentle interruption gives you a moment to choose.', expression: 'worried'},
  {title: 'A practical way to begin.', body: 'Notice your pattern. Pause before a distracting app. Return to your chosen activity.', expression: 'calm'},
  {title: 'Built around clear choices.', body: 'You set the boundary, pause without shame, and adjust as you learn.', expression: 'calm'},
  {title: 'You can always begin again.', body: 'Some days will be easier than others. Chewy is here for the next small step.', expression: 'happy'},
  {title: 'Your first week could start here.', body: 'Notice one pattern, try a 30-minute pause, and celebrate the return.', expression: 'curious'},
  {title: 'A plan you can use today.', body: 'Choose distractions to step away from. On Android, you can enable Chewy’s app boundary service when you are ready.', expression: 'happy'},
  {title: 'Ready for a little reset?', body: 'Hold the circle and give Chewy a quiet moment.', expression: 'calm', kind: 'hold'},
  {title: 'Imagine one small shift.', body: 'Your estimate beside a day with a 30-minute pause.', expression: 'happy'},
  {title: 'Choose your Chewy start.', body: 'Explore Home, all five tabs, and Android app boundaries. You can change your choices at any time.', expression: 'happy'},
];

const intro = [
  {title: 'Own your day', body: 'Notice your phone habits and make more room for the moments that matter.', expression: 'happy' as Expression, tint: colors.peach},
  {title: 'Find your focus', body: 'Set gentle boundaries for distractions and return to what you choose.', expression: 'calm' as Expression, tint: colors.lilac},
  {title: 'Celebrate small wins', body: 'Take a pause, build a streak, and let Chewy cheer you on.', expression: 'curious' as Expression, tint: colors.mint},
];

function ChoiceIndicator({selected}: {selected: boolean}) {
  return <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
    <Circle cx={13} cy={13} r={11} fill={selected ? colors.green : 'white'} stroke={colors.green} strokeWidth={1.8} />
    <Path
      d={selected ? 'm8.5 13 3 3 6-6' : 'M13 8.5v9m-4.5-4.5h9'}
      stroke={selected ? 'white' : colors.green}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>;
}

export function Onboarding({onComplete}: {onComplete: () => void}) {
  const [pageIndex, setPageIndex] = useState(-1);
  const [introIndex, setIntroIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [hours, setHours] = useState(5);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const page = pages[pageIndex];

  useEffect(() => {
    if (page?.kind !== 'processing') return;
    const timer = setTimeout(() => setPageIndex(index => index + 1), 1500);
    return () => clearTimeout(timer);
  }, [page?.kind]);

  function next() {
    if (pageIndex === pages.length - 1) onComplete();
    else setPageIndex(index => index + 1);
  }

  function toggleOption(option: string) {
    const current = answers[pageIndex] || [];
    const updated = page?.multi
      ? current.includes(option) ? current.filter(value => value !== option) : [...current, option]
      : [option];
    setAnswers({...answers, [pageIndex]: updated});
  }

  if (pageIndex < 0) {
    const panel = intro[introIndex];
    return (
      <View style={styles.screen}>
        <Text style={styles.brand}>♧  Chewy.</Text>
        <View style={styles.introMiddle}
          onTouchStart={event => {touchStartX.current = event.nativeEvent.pageX;}}
          onTouchEnd={event => {
            const movement = event.nativeEvent.pageX - touchStartX.current;
            if (Math.abs(movement) > 45) {
              setIntroIndex(index => Math.max(0, Math.min(intro.length - 1, index + (movement < 0 ? 1 : -1))));
            }
          }}>
          <View style={[styles.art, {backgroundColor: panel.tint}]}><Text style={styles.introSparkle}>✦</Text><ChewyCharacter expression={panel.expression} size={220} /></View>
          <Text style={styles.bigTitle}>{panel.title}</Text>
          <Text style={styles.subtitle}>{panel.body}</Text>
        </View>
        <View style={styles.dots}>{intro.map((_, index) => <Pressable key={index} onPress={() => setIntroIndex(index)} style={[styles.dot, index === introIndex && styles.activeDot]} />)}</View>
        <Pressable style={styles.primary} onPress={() => setPageIndex(0)}><Text style={styles.primaryText}>Get started</Text></Pressable>
      </View>
    );
  }

  const selected = answers[pageIndex] || [];
  const requiresChoice = !!page.options && selected.length === 0;
  const body = page.body.replace('{days}', String(Math.round(hours * 365 / 24)));
  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => setPageIndex(index => Math.max(-1, index - 1))} accessibilityRole="button" accessibilityLabel="Go back"><Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Path d="m12.5 4-6 6 6 6" stroke={colors.green} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg></Pressable>
        <Text style={styles.step}>{pageIndex + 1} / {pages.length}</Text>
      </View>
      <View style={styles.progress}><View style={[styles.progressFill, {width: `${((pageIndex + 1) / pages.length) * 100}%`}]} /></View>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.smallArt}><Text style={styles.smallSparkle}>✦</Text><ChewyCharacter expression={page.expression} size={132} /></View>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.body}>{body}</Text>
        {page.options?.map(option => (
          <Pressable key={option} onPress={() => toggleOption(option)} style={[styles.choice, selected.includes(option) && styles.choiceSelected]}>
            <Text style={styles.choiceText}>{option}</Text><View style={styles.choiceIndicator}><ChoiceIndicator selected={selected.includes(option)} /></View>
          </Pressable>
        ))}
        {page.kind === 'hours' && <View style={styles.hours}><Pressable onPress={() => setHours(Math.max(1, hours - 1))}><Text style={styles.adjust}>−</Text></Pressable><Text style={styles.hoursText}>{hours} hours</Text><Pressable onPress={() => setHours(Math.min(12, hours + 1))}><Text style={styles.adjust}>+</Text></Pressable></View>}
        {page.kind === 'hold' && <Pressable style={styles.hold} onPressIn={() => {holdTimer.current = setTimeout(next, 1200);}} onPressOut={() => {if (holdTimer.current) clearTimeout(holdTimer.current);}}><Text style={styles.holdText}>Hold to reset</Text></Pressable>}
      </ScrollView>
      {page.kind !== 'processing' && page.kind !== 'hold' && <Pressable disabled={requiresChoice} style={[styles.primary, requiresChoice && styles.disabled]} onPress={next}><Text style={styles.primaryText}>{pageIndex === pages.length - 1 ? 'Start with Chewy' : 'Continue'}</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: 18},
  brand: {textAlign: 'center', color: colors.green, fontSize: 27, fontWeight: '900', marginTop: 18},
  introMiddle: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  art: {width: 250, height: 230, borderRadius: 75, borderWidth: 3, borderBottomWidth: 7, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 55, transform: [{rotate: '-7deg'}]}, introSparkle: {position: 'absolute', top: 12, right: 25, fontSize: 36, color: colors.green, transform: [{rotate: '15deg'}]},
  bigTitle: {color: colors.ink, fontSize: 36, fontWeight: '900', textAlign: 'center'},
  subtitle: {fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center', marginTop: 12, maxWidth: 340},
  dots: {flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28},
  dot: {width: 9, height: 9, borderRadius: 5, backgroundColor: cartoon.mint, borderWidth: 1, borderColor: colors.green},
  activeDot: {width: 25, backgroundColor: cartoon.sunshine},
  primary: {height: 58, backgroundColor: colors.green, borderRadius: 30, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center'},
  primaryText: {color: colors.background, fontSize: 17, fontWeight: '900'},
  disabled: {opacity: 0.4},
  topRow: {height: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  backButton: {width: 38, height: 38, borderWidth: 1.5, borderColor: colors.green, backgroundColor: cartoon.sunshine, borderRadius: 19, alignItems: 'center', justifyContent: 'center'},
  step: {color: colors.green, fontWeight: '800'},
  progress: {height: 10, backgroundColor: cartoon.mint, borderWidth: 1, borderColor: colors.green, borderRadius: 6, overflow: 'hidden'},
  progressFill: {height: 10, backgroundColor: '#21ad81', borderRadius: 5},
  pageContent: {paddingVertical: 24, paddingBottom: 40},
  smallArt: {alignSelf: 'center', width: 150, height: 150, borderRadius: 55, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: cartoon.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 24}, smallSparkle: {position: 'absolute', top: -9, right: -12, fontSize: 30, color: '#f3ac56'},
  title: {fontSize: 31, fontWeight: '900', color: colors.ink, marginBottom: 12},
  body: {fontSize: 16, lineHeight: 24, color: colors.muted, marginBottom: 24},
  choice: {minHeight: 58, borderRadius: 18, paddingHorizontal: 17, marginBottom: 10, backgroundColor: colors.surface, borderWidth: 2, borderColor: '#bddfd0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  choiceSelected: {borderColor: colors.green, borderBottomWidth: 5, backgroundColor: cartoon.mint},
  choiceText: {color: colors.ink, fontSize: 15, fontWeight: '800', flex: 1},
  choiceIndicator: {marginLeft: 12},
  hours: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: cartoon.sunshine, borderWidth: 2, borderColor: colors.green, borderRadius: 22, padding: 16},
  adjust: {fontSize: 30, color: colors.green, fontWeight: '700', width: 48, textAlign: 'center'},
  hoursText: {fontSize: 22, color: colors.ink, fontWeight: '700'},
  hold: {height: 160, width: 160, borderRadius: 80, backgroundColor: cartoon.sunshine, borderWidth: 7, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', alignSelf: 'center'},
  holdText: {textAlign: 'center', color: colors.green, fontWeight: '700', fontSize: 18},
});
