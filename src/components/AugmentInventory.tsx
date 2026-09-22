import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AugmentGlossary } from './AugmentGlossary';
import { AUGMENTS } from '../game/augments';
export function AugmentInventory({ augments, compact = false, inline = false, onInspect }: {
    augments: string[];
    compact?: boolean;
    inline?: boolean;
    onInspect?: () => void;
}) {
    const [open, setOpen] = useState(false);
    return <><Pressable accessibilityRole="button" accessibilityLabel={'Inspect ' + augments.length + ' augments'} onPress={() => { onInspect?.(); setOpen(true); }} style={{ minHeight: inline?28:36, padding: inline?4:6, borderWidth: 1, borderColor: '#8275a7', borderRadius: 6, backgroundColor: '#262238' }}><Text style={{ color: '#d5c5ff', fontSize: compact ? 10 : 13, fontWeight: '700' }}>✦ {augments.length}{compact&&!inline ? "" : " Augments"}</Text>{compact && !inline && <Text numberOfLines={1} style={{ color: "#d5c5ff", fontSize: 9 }}>Augments</Text>}</Pressable>
 <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, backgroundColor: '#070912dd', padding: 20, alignItems: 'center', justifyContent: 'center' }}><View accessibilityViewIsModal style={{ width: '100%', maxWidth: 560, maxHeight: '100%', backgroundColor: '#1c2030', borderWidth: 1, borderColor: '#ab92dc', borderRadius: 12, padding: 18, gap: 12 }}><Text style={{ color: '#f1e8ff', fontSize: 22 }}>Permanent augments</Text><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{augments.length ? augments.map(id => <View key={id} style={{ gap: 5 }}><Text style={{ color: '#d3b8ff', fontSize: 16, fontWeight: '700' }}>{AUGMENTS[id].name}</Text><Text style={{ color: '#e5dff0', fontSize: 14, lineHeight: 20 }}>{AUGMENTS[id].description}</Text><AugmentGlossary description={AUGMENTS[id].description}/></View>) : <Text style={{ color: '#e5dff0', fontSize: 14 }}>After every second combat round, every player chooses one of three permanent augments. These are free rewards and never stack with themselves.</Text>}</ScrollView><Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ padding: 12, backgroundColor: '#413558', borderRadius: 6 }}><Text style={{ color: '#fff', textAlign: 'center' }}>Close augments</Text></Pressable></View></View></Modal></>;
}
