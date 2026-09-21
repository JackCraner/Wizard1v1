import { spellVisual } from './components/cards/spellVisual';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Fighter, SpellId } from './game/model';

export const colors = {
  background: '#101512', panel: '#1b231c', surface: '#242e23', line: '#354330',
  text: '#edf1e7', muted: '#a3b29a', accent: '#c3e3a7', ink: '#172112', mana: '#91b9d6',
};

export function Button({ title, onPress, disabled, secondary, label }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; label?: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ?? title}
      accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}>
      <Text style={[styles.buttonText, secondary && { color: colors.accent }]}>{title}</Text>
    </Pressable>
  );
}

export function Panel({ children }: PropsWithChildren) { return <View style={styles.panel}>{children}</View>; }
export function Eyebrow({ children }: PropsWithChildren) { return <Text style={styles.eyebrow}>{children}</Text>; }
export function Title({ children }: PropsWithChildren) { return <Text accessibilityRole="header" style={styles.title}>{children}</Text>; }
export function Heading({ children }: PropsWithChildren) { return <Text accessibilityRole="header" style={styles.heading}>{children}</Text>; }
export function Body({ children }: PropsWithChildren) { return <Text style={styles.body}>{children}</Text>; }

export function SpellIcon({ id }: { id: SpellId }) {
  return <View accessible={false} style={[styles.spellIcon, { backgroundColor: `${spellVisual(id).color}14` }]}><Text style={[styles.symbol, { color: spellVisual(id).color }]}>{spellVisual(id).glyph}</Text></View>;
}

function Meter({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <View style={{ gap: 7 }} accessible accessibilityLabel={`${label}: ${value} of ${max}`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
    <Text style={styles.meterLabel}>{label}  {value}/{max}</Text>
    <View style={styles.track}><View style={{ height: 6, width: `${max ? value / max * 100 : 0}%`, backgroundColor: color }} /></View>
  </View>;
}

export function FighterCard({ fighter }: { fighter: Fighter }) {
  return <View style={styles.fighter}>
    <Text style={styles.fighterRune}>✦</Text>
    <Text style={styles.fighterName}>{fighter.name}</Text>
    <Meter label="Health" value={fighter.health} max={fighter.maxHealth} color={colors.accent} />
    <Meter label="Mana" value={fighter.mana} max={fighter.maxMana} color={colors.mana} />
    <Text style={styles.small}>{fighter.shield} shield</Text>
  </View>;
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 },
  container: { width: '100%', maxWidth: 1060, alignSelf: 'center', gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 20, gap: 12 },
  brand: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  tag: { color: colors.accent, fontSize: 10, letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '600', letterSpacing: -1.3, lineHeight: 41 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '600' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, lineHeight: 17 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  panel: { padding: 20, gap: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.panel },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stack: { gap: 16 },
  grow: { flex: 1 },
  spellIcon: { width: 42, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  symbol: { fontSize: 28, fontWeight: '500' },
  spellName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  spellRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  slot: { width: 16, fontSize: 11, color: colors.muted },
  arrows: { flexDirection: 'row', gap: 4 },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 6 },
  empty: { paddingVertical: 13, color: '#7f8d77', fontSize: 12 },
  spellCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, gap: 12 },
  fighter: { flex: 1, minWidth: 0, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, gap: 15 },
  fighterRune: { textAlign: 'center', color: colors.accent, fontSize: 36 },
  fighterName: { color: colors.text, fontSize: 15, fontWeight: '600', minHeight: 38, textAlign: 'center' },
  meterLabel: { color: colors.muted, fontSize: 11 },
  track: { height: 6, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  footer: { color: '#86927d', fontSize: 10, letterSpacing: 1, textAlign: 'center', paddingVertical: 16 },
  error: { padding: 16, backgroundColor: '#4a2622', borderRadius: 8 },
});


