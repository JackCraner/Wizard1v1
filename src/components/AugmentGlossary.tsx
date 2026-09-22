import { Text, View } from 'react-native';
import { KEYWORDS } from '../config/catalogue';
/** Reward text explains its own vocabulary before a permanent choice is made. */
export function AugmentGlossary({ description }: {
    description: string;
}) {
    const keys = ['empowered', 'oath', 'cycle', 'poison', 'potency', 'curse', 'regeneration', 'heat', 'tidecaller', 'ward', 'slow', 'critical', 'echo', 'guard', 'resilience', 'fury', 'trap', 'weaken'];
    const items = keys.filter(id => description.toLowerCase().includes(id === "empowered" ? "empower" : id));
    return <View style={{ gap: 5 }}>{items.map(id => <Text key={id} style={{ color: '#bcb0d1', fontSize: 11, lineHeight: 16 }}><Text style={{ fontWeight: '700', color:'#e5dabd' }}>{KEYWORDS[id].name}: </Text>{KEYWORDS[id].description}</Text>)}</View>;
}
