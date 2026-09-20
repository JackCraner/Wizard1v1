import { Text, TextStyle } from 'react-native';

const domainGlyph = {
  fire: '\uE000',
  water: '\uE001',
  nature: '\uE002',
  affliction: '\uE003',
  holy: '\uE004',
} as const;

export function CardTitle({
  domain,
  children,
}: {
  domain: keyof typeof domainGlyph;
  children: string;
}) {
  const style: TextStyle = {
    fontFamily: 'AetherisDisplay',
    fontSize: 24,
    letterSpacing: 1.15,
  };

  return <Text style={style}>{domainGlyph[domain]}  {children.toUpperCase()}</Text>;
}
