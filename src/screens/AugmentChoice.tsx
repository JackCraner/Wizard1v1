import { AugmentGlossary } from '../components/AugmentGlossary';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUGMENTS } from '../game/augments';
import type { Command, Session } from '../game/model';
export function AugmentChoice({ session, busy, error, act }: {
    session: Session;
    busy: boolean;
    error?: string;
    act: (command: Command) => void;
}) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#101522', padding: 16, gap: 12 }}><View style={{ gap: 4 }}><Text style={{ color: '#b6a2db', fontSize: 11, letterSpacing: 2 }}>ROUND {session.round} COMPLETE · FREE REWARD</Text><Text accessibilityRole="header" style={{ color: '#f6e9ff', fontSize: 26, fontWeight: '700' }}>Choose your next advantage</Text><Text style={{ color: '#b9b5cb', fontSize: 13 }}>Pick one. It stays for the run. Every player receives a reward this round.</Text></View>
 <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: 12 }}>{session.augmentOffers.map((id, index) => { const a = AUGMENTS[id]; return <View key={id} style={{ flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#8b72b3', borderRadius: 12, padding: 14, backgroundColor: '#262439', gap: 10 }}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}><Text style={{ color: '#bc9cec', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{a.category.toUpperCase()} · {a.domain?.toUpperCase() ?? 'ANY DECK'}</Text><Text style={{ color: '#e9ccff', fontSize: 23 }}>✦ {String(index + 1).padStart(2, '0')}</Text><Text style={{ color: '#fff0db', fontSize: 20, fontWeight: '700' }}>{a.name}</Text><Text style={{ color: '#e0dbe9', fontSize: 14, lineHeight: 21 }}>{a.description}</Text><AugmentGlossary description={a.description}/></ScrollView><Pressable accessibilityRole="button" accessibilityLabel={'Choose ' + a.name} disabled={busy} onPress={() => act({ type: 'chooseAugment', augment: id })} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#614780', borderColor: '#bb93ef', borderWidth: 1, borderRadius: 6, opacity: busy ? .5 : 1 }}><Text style={{ color: '#fff2ff', fontSize: 14, fontWeight: '700' }}>Choose augment →</Text></Pressable></View>; })}</View>{!!error && <Text accessibilityRole="alert" style={{ color: '#ffb8a8' }}>{error}</Text>}</SafeAreaView>;
}
