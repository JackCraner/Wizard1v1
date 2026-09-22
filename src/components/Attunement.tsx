import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { attunementRanking, requiredDomains, DOMAIN_COLORS } from '../game/attunement';
import type { CardDefinition, Domain } from '../config/catalogue';

const domainName = (domain: Domain) => domain[0].toUpperCase() + domain.slice(1);

export function AttunementPanel({ spells, ages }: { spells: string[]; ages?: number[] }) {
    const [open, setOpen] = useState(false);
    const ranks = attunementRanking(spells, ages);
    return <>
        <Pressable accessibilityRole="button"
            accessibilityLabel={'Attuned domains: ' + (ranks.slice(0, 2).map(r => r.domain + ' ' + r.count).join(', ') || 'none') + '. View priority.'}
            onPress={() => setOpen(true)} style={{ gap: 4, minHeight: 44 }}>
            <Text style={{ color: '#e8d4a4', fontSize: 10, fontWeight: '800' }}>ATTUNED {Math.min(2, ranks.length)}/2</Text>
            {ranks.slice(0, 2).map(r => <Text key={r.domain} style={{ color: DOMAIN_COLORS[r.domain], fontSize: 12, fontWeight: '700' }}>
                {domainName(r.domain)} ×{r.count}
            </Text>)}
            {!ranks.length && <Text style={{ color: '#aab8b7', fontSize: 10 }}>Your spells decide.</Text>}
        </Pressable>
        <Modal transparent visible={open} onRequestClose={() => setOpen(false)}>
            <View style={{ flex: 1, backgroundColor: '#000b', padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 460, maxHeight: '100%', backgroundColor: '#17242c', padding: 18, borderRadius: 12, gap: 12 }}>
                    <Text accessibilityRole="header" style={{ color: '#fff0d2', fontSize: 22 }}>Domain attunement</Text>
                    <Text style={{ color: '#d0ddd9', fontSize: 14, lineHeight: 21 }}>
                        Your two most numerous domains activate effects marked as requiring attunement. Ties favor the oldest card still held. Reordering never changes this priority. Other spells retain their basic effects.
                    </Text>
                    <ScrollView contentContainerStyle={{ gap: 8 }}>
                        {ranks.map((r, i) => <Text key={r.domain} style={{ color: DOMAIN_COLORS[r.domain], fontSize: 15 }}>
                            {i + 1}. {domainName(r.domain)} · {r.count} {r.count === 1 ? 'card' : 'cards'} · {i < 2 ? 'Attuned' : 'Basic effects only'} · oldest #{r.oldest + 1}
                        </Text>)}
                    </ScrollView>
                    <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ padding: 12, backgroundColor: '#344951', borderRadius: 6 }}>
                        <Text style={{ color: '#fff', textAlign: 'center' }}>Close attunement</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    </>;
}

export function AttunementNote({ card, domains }: { card: CardDefinition; domains: readonly Domain[] }) {
    const required = [...new Set([...requiredDomains(card.combat?.effects ?? []), ...(card.instantDomain ? [card.instantDomain] : []), ...(card.castDomain ? [card.castDomain] : [])])];
    if (!required.length) return null;
    return <View style={{ gap: 3 }}>
        <Text style={{ color: '#a8bbb6', fontSize: 10 }}>WITH YOUR CURRENT DECK</Text>
        {required.map(d => <Text key={d} style={{ color: DOMAIN_COLORS[d], fontSize: 12, fontWeight: '700' }}>
            {domains.includes(d) ? '✓ Active' : '○ Inactive'} · {domainName(d)} keyword / bonus
        </Text>)}
    </View>;
}
