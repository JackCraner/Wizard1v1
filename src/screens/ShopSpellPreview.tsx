import {keywordDomain,DOMAIN_COLORS} from '../game/attunement';
import type {Domain} from '../config/catalogue';
import { Text, View } from 'react-native';
import { RulesText, SpellCard } from '../components/cards/SpellCard';
import { castLabel, explainedKeywords } from '../config/catalogue';
import { cardAt } from '../game/upgrades';
import type { SpellId } from '../game/model';

/** Reading text stays at a mobile-readable size instead of scaling with card art. */
export function ShopSpellPreview({ id, xp = 0, shop, width, height,domains=[] }: {
  domains?:Domain[]; id: SpellId; xp?: number; shop?: boolean; width: number; height: number;
}) {
  const card = cardAt(id, xp);
  const artWidth = Math.min(110, width * .29);
  const keywords = explainedKeywords(card.keywords);
  return <View accessibilityLabel={`Preview of ${card.name}`} style={{ width, height, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#c7b17b', backgroundColor: '#12211ffb', gap: 10 }}>
    <View style={{ flexDirection: 'row', gap: 12, flex: 1, minHeight: 0 }}>
      <View style={{ width: artWidth, gap: 10 }}><View style={{ width: artWidth, height: artWidth * 1.5 }}><SpellCard {...card} shop={shop} compact /></View><Text style={{ color: '#c6bf9f', fontSize: 11 }}>{card.domain.toUpperCase()}</Text><Text style={{ color: '#edce87', fontSize: 12 }}>{shop ? `${card.stars} gold` : `${xp}/3 XP`}</Text></View>
      <View style={{ flex: 1, gap: 8, overflow: 'hidden' }}>
        <Text style={{ color: '#f6e9c9', fontSize: 18, fontWeight: '700' }}>{card.name}</Text>
        <Text style={{ color: '#b4d3ca', fontSize: 12 }}>{castLabel(card.castTicks)}</Text>
        <RulesText card={card} domains={domains} rules={card.rules} keywords={card.keywords} fontSize={14} color="#f0e8d5" />
        {keywords.filter(k=>k.id!=="attunement").slice(0, 1).map(keyword => <Text key={keyword.id} numberOfLines={4} style={{ color: '#adc2b5', fontSize: 11, lineHeight: 15 }}><Text style={{ color:keywordDomain(keyword.name)?DOMAIN_COLORS[keywordDomain(keyword.name)!]:'#e2d19e', fontWeight: '700' }}>{keyword.name} · </Text>{keyword.description}</Text>)}
      </View>
    </View>
    <Text style={{ color: '#aab7a4', fontSize: 10 }}>Release to place · tap the spell for full details</Text>
  </View>;
}
