import { cardAt, UPGRADE_XP } from '../game/upgrades';
import { explainedKeywords } from '../config/catalogue';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CARDS, castLabel, goldCost, type CardDefinition } from '../config/catalogue';
import { KeywordBoxes, SpellCard, RulesText } from '../components/cards/SpellCard';

export function CardLibrary({ onClose }: { onClose: () => void }) {
  const { height, width } = useWindowDimensions();
  const [upgraded,setUpgraded]=useState(false);
  const [domain, setDomain] = useState('nature');
  const [stars, setStars] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CardDefinition | null>(null);
  const [held, setHeld] = useState<CardDefinition | null>(null);
  const didHold = useRef(false);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => subscription.remove();
  }, [onClose]);
  const perPage = width >= 950 ? 6 : 4;
  const cards = useMemo(() => CARDS.map(c=>cardAt(c.id,upgraded?UPGRADE_XP:0)).filter(c => c.domain === domain && (!stars || c.stars === stars) && `${c.name} ${c.rules}`.toLowerCase().includes(query.toLowerCase())), [domain, stars, query, upgraded]);
  const pages = Math.max(1, Math.ceil(cards.length / perPage));
  const shownPage = Math.min(page, pages - 1);
  const cardHeight = Math.min(330, Math.max(125, height - 145));
  const reset = () => setPage(0);
  return <SafeAreaView style={s.root}>
    <Image accessible={false} source={require('../../assets/MainBackground.png')} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: .2 }]} />
    <View style={s.header}><Pressable accessibilityRole="button" onPress={onClose} style={s.button}><Text style={s.text}>‹ Back</Text></Pressable><View style={{ flex: 1 }}><Text style={s.title}>Spell library</Text><Text style={s.caption}>{CARDS.length} cards · Gold cost = stars · Hold to enlarge</Text></View><TextInput accessibilityLabel="Search spells" placeholder="Search spells…" placeholderTextColor="#9d8e76" value={query} onChangeText={value => { setQuery(value); reset(); }} style={s.search} /></View>
    <View style={s.filters}><Pressable accessibilityRole="button" accessibilityLabel={upgraded?'Show base cards':'Show upgraded cards'} onPress={()=>setUpgraded(!upgraded)} style={[s.button,upgraded&&s.active]}><Text style={s.text}>{upgraded?'Upgraded':'Base'}</Text></Pressable>{[...new Set(CARDS.map(c=>c.domain))].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === domain }} onPress={() => { setDomain(value); reset(); }} style={[s.button, value === domain && s.active]}><Text style={s.text}>{value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}<View style={{ flex: 1 }} />{[0,1,2,3,4,5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={value ? `${value} star cards` : 'All stars'} accessibilityState={{ selected: value === stars }} onPress={() => { setStars(value); reset(); }} style={[s.starButton, value === stars && s.active]}><Text style={s.text}>{value ? `${value}★` : 'All'}</Text></Pressable>)}</View>
    <View style={s.grid}>{cards.slice(shownPage * perPage, (shownPage + 1) * perPage).map(card => <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={`Inspect ${card.name}, ${card.stars} stars`} delayLongPress={300} onPressIn={() => { didHold.current = false; }} onLongPress={() => { didHold.current = true; setHeld(card); }} onPressOut={() => setHeld(null)} onPress={() => { if (!didHold.current) setSelected(card); }} style={{ flex: 1, minWidth: 0, alignItems: 'center' }}><View style={{ height: cardHeight, aspectRatio: 2 / 3, maxWidth: '100%' }}><SpellCard {...card} /></View><Text style={s.caption}>{goldCost(card)} gold · {castLabel(card.castTicks)}</Text></Pressable>)}{!cards.length && <Text style={s.text}>No matching spells.</Text>}</View>
    <View style={s.footer}><Text style={[s.caption, { flex: 1 }]}>{cards.length} spells · Only cards with resolved mechanics appear in the shop.</Text><Pressable disabled={shownPage === 0} accessibilityRole="button" accessibilityLabel="Previous card page" onPress={() => setPage(shownPage - 1)} style={[s.button, shownPage === 0 && s.disabled]}><Text style={s.text}>‹</Text></Pressable><Text style={s.text}>{shownPage + 1}/{pages}</Text><Pressable disabled={shownPage + 1 === pages} accessibilityRole="button" accessibilityLabel="Next card page" onPress={() => setPage(shownPage + 1)} style={[s.button, shownPage + 1 === pages && s.disabled]}><Text style={s.text}>›</Text></Pressable></View>
    {held && <View pointerEvents="none" style={s.holdShade}><View style={{ flexDirection: 'row', gap: 12, height: height - 32, maxWidth: width - 32 }}><View style={{ height: height - 32, aspectRatio: 2 / 3 }}><SpellCard {...held} /></View>{explainedKeywords(held.keywords).length > 0 && <View style={{ width: Math.min(280, width * .38), justifyContent: 'center' }}><KeywordBoxes keywords={held.keywords} small /></View>}</View></View>}
    <Modal transparent visible={!!selected} animationType="fade" onRequestClose={() => setSelected(null)}><View style={s.shade}>{selected && <View accessibilityViewIsModal style={[s.detail, { maxHeight: height - 20 }]}><View style={{ width: Math.min(210, (height - 50) * 2 / 3), aspectRatio: 2 / 3 }}><SpellCard {...selected} /></View><View style={{ flex: 1, minHeight: 0, gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={s.title}>{selected.name}</Text><Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={s.button}><Text style={s.text}>Close</Text></Pressable></View><ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}><Text style={s.text}>{goldCost(selected)} gold · {castLabel(selected.castTicks)}</Text><RulesText rules={selected.rules} keywords={selected.keywords} color="#f1dfba" /><KeywordBoxes keywords={selected.keywords} />{selected.combat?.blockedReason && <Text style={s.caption}>Not yet playable: {selected.combat.blockedReason}</Text>}{selected.notes.length > 0 && <View style={s.note}><Text style={s.noteTitle}>Rules to confirm</Text>{selected.notes.map(note => <Text key={note} style={s.caption}>• {note}</Text>)}</View>}</ScrollView></View></View>}</View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#19120d', padding: 10, gap: 7 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { color: '#eed5a1', fontSize: 20, fontWeight: '600' }, text: { color: '#f1dfba', fontSize: 12 }, caption: { color: '#c1aa82', fontSize: 10, lineHeight: 14 }, search: { color: '#eee0c4', width: 175, minHeight: 34, padding: 7, borderWidth: 1, borderColor: '#8f7545', borderRadius: 4, backgroundColor: '#17140fdc' },
  button: { minHeight: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#897043', borderRadius: 4, backgroundColor: '#282318' }, starButton: { minHeight: 30, paddingHorizontal: 9, justifyContent: 'center', borderRadius: 4 }, active: { backgroundColor: '#46603c', borderColor: '#d6b36b' }, filters: { flexDirection: 'row', gap: 6, alignItems: 'center' }, grid: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center' }, footer: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' }, disabled: { opacity: .3 },
  shade: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000c' }, detail: { flexDirection: 'row', gap: 18, width: '100%', maxWidth: 700, padding: 14, backgroundColor: '#20170f', borderWidth: 1, borderColor: '#ba9558', borderRadius: 7 }, note: { padding: 8, backgroundColor: '#443019', borderRadius: 4, gap: 5 }, noteTitle: { fontSize: 11, fontWeight: '600', color: '#e6c78d' }, holdShade: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#000c', alignItems: 'center', justifyContent: 'center' },
});


