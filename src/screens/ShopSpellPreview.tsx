import { DOMAIN_COLORS } from '../theme';
import { keywordDomain } from '../game/attunement';
import type { Domain } from '../config/catalogue';
import { Text, View } from 'react-native';
import { RulesText, UpgradeDetails } from '../components/cards/SpellCard';
import { castLabel, explainedKeywords, goldCost } from '../config/catalogue';
import { cardAt, UPGRADE_XP } from '../game/upgrades';
import type { SpellId } from '../game/model';
import { upgradeSummary } from '../game/cardText';

/** Text takes priority in the phone's held-card preview. */
export function ShopSpellPreview({ id, xp = 0, shop, width, height, domains = [] }: {
  domains?: Domain[]; id: SpellId; xp?: number; shop?: boolean; width: number; height: number;
}) {
  const card = cardAt(id, xp);
  const keywords = explainedKeywords(card.keywords).filter(k => k.id !== 'attunement');
  const dense = card.rules.length + (card.upgraded ? 0 : upgradeSummary(card).length) > 240;
  return <View accessibilityLabel={`Preview of ${card.name}`} style={{ width, height, padding: dense ? 10 : 12, borderRadius: 12, borderWidth: 1, borderColor: '#c7b17b', backgroundColor: '#12211ffb', gap: dense ? 4 : 8 }}>
    <Text style={{ color: '#f6e9c9', fontSize: 18, fontWeight: '700' }}>{card.name}</Text>
    <Text style={{ color: '#b4d3ca', fontSize: 12 }}>{castLabel(card.castTicks)} · {card.domain.toUpperCase()} · {shop ? `${goldCost(card)} gold` : `${xp}/${UPGRADE_XP} XP`}</Text>
    <RulesText card={card} domains={domains} rules={card.rules} keywords={card.keywords} fontSize={dense ? 12 : 14} color="#f0e8d5" />
    <UpgradeDetails card={card} compact={dense} />
    {keywords.slice(0, 1).map(keyword => <Text key={keyword.id} style={{ color: '#adc2b5', fontSize: 11, lineHeight: 15 }}><Text style={{ color: keywordDomain(keyword.name) ? DOMAIN_COLORS[keywordDomain(keyword.name)!] : '#e2d19e', fontWeight: '700' }}>{keyword.name} · </Text>{keyword.description}</Text>)}
    <Text style={{ color: '#aab7a4', fontSize: 10, marginTop: 'auto' }}>Tap the spell for full details</Text>
  </View>;
}
