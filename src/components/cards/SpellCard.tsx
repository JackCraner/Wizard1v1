import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { castLabel, manaLabel, goldCost, keywordSpans, explainedKeywords, type CardDefinition, type Domain } from '../../config/catalogue';
import { SPELL_ART } from './spellArt';

const frames: Record<Domain, ImageSourcePropType> = {
  nature: require('../../../assets/Nature_Border.png'), water: require('../../../assets/Water_Border.png'),
  fire: require('../../../assets/Fire_Border.png'), holy: require('../../../assets/Holy_Border.png'), affliction: require('../../../assets/Affliction_Border.png'),
};
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
export type SpellCardProps = CardDefinition & { art?: ImageSourcePropType; compact?: boolean };
export function RulesText({ rules, keywords, fontSize = 12, color = '#302117' }: { rules: string; keywords: string[]; fontSize?: number; color?: string }) {
  return <Text style={{ fontSize, color, lineHeight: fontSize * 1.2, textAlign: 'center' }}>{keywordSpans(rules, keywords).map((part, i) => <Text key={i} style={part.bold ? { fontWeight: '800' } : undefined}>{part.text}</Text>)}</Text>;
}
export function SpellCard({ compact = false, art, ...card }: SpellCardProps) {
  const [size, setSize] = useState({ width: 160, height: 240 });
  const scale = size.width / 160;
  const artwork = art ?? SPELL_ART[card.id];
  const rulesSize = Math.min(13, Math.max(4, scale * (card.rules.length > 105 ? 9.5 : 11)));
  return <View onLayout={e => setSize(e.nativeEvent.layout)} accessible accessibilityLabel={`${card.name}, ${card.domain}, ${card.stars} stars, ${goldCost(card)} gold, ${manaLabel(card.mana)} mana, ${castLabel(card.castTicks)}. ${card.rules}`} style={s.card}>
    <Image accessible={false} source={frames[card.domain]} resizeMode="stretch" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    {artwork && <View style={s.art}><Image accessible={false} source={artwork} resizeMode="cover" style={{ width: '100%', height: '100%' }} /></View>}
    <View style={s.mana}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.value, { fontSize: 17 * scale, color: '#edfbff', textShadowColor: '#032034' }]}>{manaLabel(card.mana)}</Text></View>
    <View style={s.cast}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.value, { fontSize: (card.castTicks === null ? 11 : 16) * scale }]}>{card.castTicks === 0 ? 'ϟ' : card.castTicks === null ? '?' : card.castTicks}<Text style={{ fontSize: 7 * scale }}>{card.castTicks ? 'T' : ''}</Text></Text></View>
    <View style={s.name}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.5} style={{ color: '#f4e1b7', fontFamily: serif, fontWeight: '600', fontSize: 14 * scale, textAlign: 'center' }}>{card.name}</Text></View>
    <View style={s.stars}><Text style={{ color: '#e1be63', fontSize: 10 * scale, letterSpacing: scale }}>{'★'.repeat(card.stars)}</Text></View>
    <View style={s.rules}>{compact && size.height < 115 ? <Text style={{ fontSize: 9 * scale, color: '#382617', textAlign: 'center' }}>{card.domain.toUpperCase()}</Text> : <RulesText rules={card.rules} keywords={card.keywords} fontSize={rulesSize} />}</View>
    <Text style={[s.domain, { fontSize: 7.5 * scale }]}>{card.domain.toUpperCase()} · {goldCost(card)} GOLD</Text>
  </View>;
}
export function KeywordBoxes({ keywords, small = false }: { keywords: string[]; small?: boolean }) {
  const items = explainedKeywords(keywords);
  if (!items.length) return null;
  return <View style={{ gap: small ? 3 : 6 }}>{items.map(item => <View key={item.id} style={[s.keyword, { padding: small ? 5 : 8 }]}><Text style={{ color: '#f2d394', fontSize: small ? 10 : 13, fontWeight: '800' }}>{item.name}</Text><Text style={{ color: '#e0d0ad', fontSize: small ? 9 : 11, lineHeight: small ? 11 : 15 }}>{item.description}</Text></View>)}</View>;
}
export function CardPreview({ card, height = 260, width }: { card: CardDefinition; height?: number; width?: number }) {
  const cardWidth = height * 2 / 3;
  const hasKeywords = explainedKeywords(card.keywords).length > 0;
  return <View style={{ flexDirection: 'row', gap: hasKeywords ? 8 : 0, width: hasKeywords ? (width ?? cardWidth + 200) : cardWidth, height }}>
    <View style={{ width: cardWidth, height }}><SpellCard {...card} /></View>
    {hasKeywords && <View style={{ flex: 1, minWidth: 0 }}><KeywordBoxes keywords={card.keywords} small /></View>}
  </View>;
}
const s = StyleSheet.create({
  card: { flex: 1, overflow: 'hidden' }, art: { position: 'absolute', left: '10%', right: '10%', top: '15%', height: '35%', overflow: 'hidden', borderRadius: 4 },
  value: { fontFamily: serif, fontWeight: '900', color: '#fff0c5', textAlign: 'center', textShadowColor: '#160b03', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3, includeFontPadding: false }, mana: { position: 'absolute', top: '6.1%', left: '7.5%', width: '13%', height: '10%', alignItems: 'center', justifyContent: 'center' }, cast: { position: 'absolute', top: '5.3%', right: '5.5%', width: '13%', height: '10%', alignItems: 'center', justifyContent: 'center' },
  name: { position: 'absolute', top: '51%', height: '8%', left: '9%', right: '9%', justifyContent: 'center' }, stars: { position: 'absolute', top: '59%', height: '6%', left: '9%', right: '9%', alignItems: 'center', justifyContent: 'center' },
  rules: { position: 'absolute', top: '66%', bottom: '13%', left: '11%', right: '11%', justifyContent: 'center' }, domain: { position: 'absolute', bottom: '8%', left: '10%', right: '10%', textAlign: 'center', color: '#302318' }, keyword: { backgroundColor: '#21180ff5', borderWidth: 1, borderColor: '#93753f', borderRadius: 4 },
});
