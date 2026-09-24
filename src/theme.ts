import { Platform, StyleSheet } from 'react-native';
import type { Domain } from './config/catalogue';

export const colors = {
  background: '#101512', panel: '#1b231c', surface: '#242e23', line: '#354330',
  text: '#edf1e7', muted: '#a3b29a', accent: '#c3e3a7', ink: '#172112',
};

export const palette = {
 white: '#ffffff', black: '#000000', overlay: '#000b', overlayStrong: '#000c',
 gold: '#ffe19a', goldMuted: '#e8d4a4', goldBorder: '#b8955f', goldBright: '#efd088',
 parchment: '#fff0d2', parchmentMuted: '#eee0ca', parchmentWarm: '#f1dfba',
 purple: '#be85e9', purpleLight: '#e3baff', lavender: '#d5c5ff', lavenderText: '#e5dff0',
 ward: '#8bd7ff', dangerText: '#efaaa0', shadow: '#120700',
 shopSurface: '#132721', brownBorder: '#443829', brownSurface: '#21190f',
 warmSurface: '#30291f', darkSurface: '#302117', cream: '#fff0d1', brass: '#e2bf70',
} as const;

export const combatColors = {
 reshuffle: '#92989f',
 trigger: '#69ffe0', dart: '#8ffff0', retrigger: '#efb4ff', empowered: '#ffb955', echo: '#79dfff', echoSurface: '#14394b',
 awakened: '#e9aaff', casting: '#ffe5a2', readySurface: '#153b38', castingSurface: '#34312a',
 cardSurface: '#14212a', brokenSurface: '#53262b', armed: '#e6ffb0', activated: '#baffef',
} as const;

// Ember → orange → hot gold → Empowered flare.
export const heatColors = ['#ac3829', '#db542e', '#ff7c29', '#ffa436', '#ffd15b', '#fff0a3'] as const;

// Bright colors on dark UI; ink colors on parchment cards; soft colors on icons.
export const DOMAIN_COLORS: Record<Domain, string> = {
 nature: '#81cf68', water: '#64c9ef', fire: '#ff7864', holy: '#edc565', affliction: '#bf8feb',
};
export const DOMAIN_INK: Record<Domain, string> = {
 nature: '#286721', water: '#075b83', fire: '#a52b20', holy: '#765000', affliction: '#713592',
};
export const DOMAIN_SOFT: Record<Domain, string> = {
 nature: '#a6d982', water: '#89d4ed', fire: '#f2a16d', holy: '#ffe29b', affliction: '#cea5ef',
};
export const typography = { serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const radii = { sm: 4, md: 8, lg: 14 } as const;

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 },
  container: { width: '100%', maxWidth: 1060, alignSelf: 'center', gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 20, gap: spacing.md },
  brand: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  tag: { color: colors.accent, fontSize: 10, letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '600', letterSpacing: -1.3, lineHeight: 41 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '600' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, lineHeight: 17 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  panel: { padding: spacing.xl, gap: spacing.lg, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, backgroundColor: colors.panel },
  button: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.75 },
  footer: { color: '#86927d', fontSize: 10, letterSpacing: 1, textAlign: 'center', paddingVertical: 16 },
  error: { padding: 16, backgroundColor: '#4a2622', borderRadius: radii.md },
});
