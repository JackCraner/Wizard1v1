import { Text, View } from 'react-native';
import {DOMAIN_COLORS,KEYWORD_DOMAINS} from '../game/attunement';
import { KEYWORDS } from '../config/catalogue';
/** Reward text explains its own vocabulary before a permanent choice is made. */
export function AugmentGlossary({ description }: {
    description: string;
}) {
    const keys = ['empowered', 'oath', 'cycle', 'poison', 'regeneration', 'heat', 'tide', 'ward', 'slow'];
    const items = keys.filter(id => description.toLowerCase().includes(id === "empowered" ? "empower" : id));
    return <View style={{ gap: 5 }}>{items.map(id => <Text key={id} style={{ color: '#bcb0d1', fontSize: 11, lineHeight: 16 }}><Text style={{ fontWeight: '700', color:KEYWORD_DOMAINS[id]?DOMAIN_COLORS[KEYWORD_DOMAINS[id]]:'#e5dabd' }}>{KEYWORDS[id].name}: </Text>{KEYWORDS[id].description}</Text>)}</View>;
}
