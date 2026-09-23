import { colors, styles } from './theme';
export { colors, styles } from './theme';
import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';

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

