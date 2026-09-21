import { cardAt, UPGRADE_XP } from '../../game/upgrades';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';
import { useId, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { castLabel, manaLabel, goldCost, keywordSpans, explainedKeywords, type CardDefinition, type Domain } from '../../config/catalogue';
import { SPELL_ART } from './spellArt';

const frames: Record<Domain, ImageSourcePropType> = {
  nature: require('../../../assets/Nature_Border.png'), water: require('../../../assets/Water_Border.png'),
  fire: require('../../../assets/Fire_Border.png'), holy: require('../../../assets/Holy_Border.png'), affliction: require('../../../assets/Affliction_Border.png'),
};
const shopFrames: Record<Domain, ImageSourcePropType> = {
 nature: require('../../../assets/Nature_Border_shop.png'), water: require('../../../assets/Water_Border_shop.png'),
 fire: require('../../../assets/Fire_Border_shop.png'), holy: require('../../../assets/Holy_Border_shop.png'), affliction: require('../../../assets/Affliction_Border_shop.png'),
};
const upgradedFrames:Partial<Record<Domain,ImageSourcePropType>>={
 nature:require('../../../assets/Nature_Border_upgraded.png'),water:require('../../../assets/Water_Border_Upgraded.png'),fire:require('../../../assets/Fire_Border_Upgraded.png'),
};
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
export type SpellCardProps = CardDefinition & { art?: ImageSourcePropType; compact?: boolean; shop?: boolean };
export function RulesText({ rules, keywords, fontSize = 12, color = '#302117' }: { rules: string; keywords: string[]; fontSize?: number; color?: string }) {
  return <Text style={{ fontSize, color, lineHeight: fontSize * 1.2, textAlign: 'center' }}>{keywordSpans(rules, keywords).map((part, i) => <Text key={i} style={part.bold ? { fontWeight: '800' } : undefined}>{part.text}</Text>)}</Text>;
}
export function SpellCard({ compact = false, shop = false, art, ...input }: SpellCardProps) {
  const card=input.xp!==undefined?cardAt(input.id,input.xp):input;
  const [size, setSize] = useState({ width: 160, height: 240 });
  const scale = size.width / 160;
  const frameRatio = size.height / Math.max(1, size.width);
  const artClipId = 'card-art-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const artwork = art ?? SPELL_ART[card.id];
  const rulesSize = Math.min(13, Math.max(4, scale * (card.rules.length > 105 ? 9.5 : 11)));
  return <View onLayout={e => setSize(e.nativeEvent.layout)} accessible accessibilityLabel={`${card.name}, ${card.upgraded?'Upgraded':`${card.xp??0} of ${UPGRADE_XP} XP`}, ${card.domain}, ${card.stars} stars, ${goldCost(card)} gold, ${manaLabel(card.mana)} mana, ${castLabel(card.castTicks)}. ${card.rules}`} style={s.card}>
    <Image accessible={false} source={shop?shopFrames[card.domain]:card.upgraded?(upgradedFrames[card.domain]??frames[card.domain]):frames[card.domain]} resizeMode="stretch" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    {artwork && <Svg pointerEvents="none" width={size.width} height={size.height} viewBox={`0 0 1000 ${1000 * frameRatio}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs><ClipPath id={artClipId}>
        {/* Trace the illustration opening, leaving the gem, stat sockets,
            corner ornaments and curved lower border on the original frame. */}
        <Path transform={`scale(1 ${frameRatio})`} d={shop ? "M 255 115 L 285 60 L 450 60 L 500 100 L 555 60 L 765 60 Q 775 145 895 150 L 914 230 L 914 428 Q 914 505 810 505 L 190 505 Q 85 505 85 428 L 85 230 L 130 190 Z" : card.upgraded ? "M 275 100 L 440 100 L 500 125 L 560 100 L 780 100 Q 780 170 885 173 L 898 250 L 898 430 Q 890 495 790 497 L 220 497 Q 112 497 105 430 L 105 250 L 145 192 Z" : "M 285 115 L 710 115 L 780 100 Q 777 150 905 150 L 914 230 L 914 428 Q 914 495 810 497 L 190 497 Q 85 495 85 428 L 85 230 L 130 190 L 255 120 Z"} />
      </ClipPath></Defs>
      <SvgImage href={artwork} x={65} y={55 * frameRatio} width={870} height={456 * frameRatio} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${artClipId})`} />
    </Svg>}
    {!shop && !card.upgraded && <View pointerEvents="none" style={{position:'absolute',left:'33.7%',top:'6.5%',width:'32.5%',height:'4.1%',flexDirection:'row',gap:2*scale}}>{[0,1,2].map(i=><View key={i} style={{flex:1,borderRadius:2*scale,backgroundColor:i<(card.xp??0)?'#ffd45f':'transparent',shadowColor:'#ffdc6e',shadowOpacity:i<(card.xp??0)?1:0,shadowRadius:5*scale,shadowOffset:{width:0,height:0}}}>{i<(card.xp??0)&&<Image source={require('../../../assets/XP point.png')} resizeMode="stretch" style={{position:'absolute',left:'-12%',top:'-28%',width:'124%',height:'156%'}} />}</View>)}</View>}
    <View style={s.mana}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.value, { fontSize: 17 * scale, color: '#edfbff', textShadowColor: '#032034' }]}>{manaLabel(card.mana)}</Text></View>
    <View style={s.cast}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.value, { fontSize: (card.castTicks === null ? 11 : 16) * scale }]}>{card.castTicks === 0 ? 'ϟ' : card.castTicks === null ? '?' : card.castTicks}<Text style={{ fontSize: 7 * scale }}>{card.castTicks ? 'T' : ''}</Text></Text></View>
    <View style={s.name}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.5} style={{ color: '#f4e1b7', fontFamily: serif, fontWeight: '600', fontSize: 14 * scale, textAlign: 'center' }}>{card.name}</Text></View>
    <View style={s.stars}><Text style={{ color: '#e1be63', fontSize: 10 * scale, letterSpacing: scale }}>{'★'.repeat(card.stars)}</Text></View>
    <View style={s.rules}>{compact && size.height < 115 ? <Text style={{ fontSize: 9 * scale, color: '#382617', textAlign: 'center' }}>{card.domain.toUpperCase()}</Text> : <RulesText rules={card.rules} keywords={card.keywords} fontSize={rulesSize} />}</View>
    <Text style={[s.domain, { fontSize: 7.5 * scale }]}>{card.upgraded?'UPGRADED · ':''}{card.domain.toUpperCase()} · {goldCost(card)} GOLD</Text>
  </View>;
}
export function KeywordBoxes({ keywords, small = false }: { keywords: string[]; small?: boolean }) {
  const items = explainedKeywords(keywords);
  if (!items.length) return null;
  return <View style={{ gap: small ? 3 : 6 }}>{items.map(item => <View key={item.id} style={[s.keyword, { padding: small ? 5 : 8 }]}><Text style={{ color: '#f2d394', fontSize: small ? 10 : 13, fontWeight: '800' }}>{item.name}</Text><Text style={{ color: '#e0d0ad', fontSize: small ? 9 : 11, lineHeight: small ? 11 : 15 }}>{item.description}</Text></View>)}</View>;
}
export function CardPreview({ card, height = 260, width, shop = false }: { card: CardDefinition; height?: number; width?: number; shop?: boolean }) {
  const cardWidth = height * 2 / 3;
  const hasKeywords = explainedKeywords(card.keywords).length > 0;
  return <View style={{ flexDirection: 'row', gap: hasKeywords ? 8 : 0, width: hasKeywords ? (width ?? cardWidth + 200) : cardWidth, height }}>
    <View style={{ width: cardWidth, height }}><SpellCard {...card} shop={shop} /></View>
    {hasKeywords && <View style={{ flex: 1, minWidth: 0 }}><KeywordBoxes keywords={card.keywords} small /></View>}
  </View>;
}
const s = StyleSheet.create({
  card: { flex: 1, overflow: 'hidden' }, art: { position: 'absolute', left: '10%', right: '10%', top: '15%', height: '35%', overflow: 'hidden', borderRadius: 4 },
  value: { fontFamily: serif, fontWeight: '900', color: '#fff0c5', textAlign: 'center', textShadowColor: '#160b03', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3, includeFontPadding: false }, mana: { position: 'absolute', top: '6.1%', left: '7.5%', width: '13%', height: '10%', alignItems: 'center', justifyContent: 'center' }, cast: { position: 'absolute', top: '5.3%', right: '5.5%', width: '13%', height: '10%', alignItems: 'center', justifyContent: 'center' },
  name: { position: 'absolute', top: '51%', height: '8%', left: '9%', right: '9%', justifyContent: 'center' }, stars: { position: 'absolute', top: '59%', height: '6%', left: '9%', right: '9%', alignItems: 'center', justifyContent: 'center' },
  rules: { position: 'absolute', top: '66%', bottom: '13%', left: '11%', right: '11%', justifyContent: 'center' }, domain: { position: 'absolute', bottom: '8%', left: '10%', right: '10%', textAlign: 'center', color: '#302318' }, keyword: { backgroundColor: '#21180ff5', borderWidth: 1, borderColor: '#93753f', borderRadius: 4 },
});
