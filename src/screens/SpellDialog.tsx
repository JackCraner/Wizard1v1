import { trashRefund } from '../game/augments';
import { upgradeSummary } from '../game/cardText';
import {attunedDomains} from '../game/attunement';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { KeywordBoxes, RulesText, SpellCard } from '../components/cards/SpellCard';
import { spellVisual } from '../components/cards/spellVisual';
import { castLabel } from '../config/catalogue';
import { channelPower, RULES, SPELLS, spellAddReason } from '../game/engine';
import type { Command, Session, SpellId } from '../game/model';
import { canMerge, cardAt, UPGRADE_XP } from '../game/upgrades';

export type SpellSelection = { kind: 'shop'; id: SpellId; shopSlot: number } | { kind: 'hand'; index: number };
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

function Button({ label, onPress, disabled, primary, danger }: {
  label: string; onPress: () => void; disabled?: boolean; primary?: boolean; danger?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, primary && s.primary, danger && s.danger, disabled && s.disabled, pressed && { opacity: .75 }]}>
    <Text style={[s.buttonText, danger && { color: '#efb5a9' }]}>{label}</Text>
  </Pressable>;
}

export function SpellDialog({ selection, session, busy, error, act, onClose, onSelect }: {
  selection: SpellSelection; session: Session; busy: boolean; error?: string;
  act: (command: Command) => void; onClose: () => void; onSelect: (next: SpellSelection) => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  const [showKeywords, setShowKeywords] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const pendingMove = useRef<{ to: number; revision: number } | null>(null);
  const shop = selection.kind === 'shop';
  const id = shop ? selection.id : session.spells[selection.index];
  const card = cardAt(id, shop ? 0 : session.spellXp?.[selection.index]);
  const accent = spellVisual(id).color;
  const price = SPELLS[id].price;
  const xp = card.xp ?? 0;
  const addReason = spellAddReason(session.spells, id);
  const purchaseReason = session.gold < price ? `You need ${price - session.gold} more gold.`
    : session.spells.length >= RULES.slots ? 'Your hand is full. Merge a matching copy or remove a spell.' : addReason;
  const artHeight = Math.min(330, height - 220);
  const showArt = width >= 650 && artHeight >= 180;

  useEffect(() => {
    if (pendingMove.current && session.revision > pendingMove.current.revision) {
      onSelect({ kind: 'hand', index: pendingMove.current.to });
      pendingMove.current = null;
    } else if (!busy) pendingMove.current = null;
  }, [session.revision, busy, onSelect]);

  const finish = (command: Command) => { act(command); onClose(); };
  const move = (to: number) => {
    if (selection.kind !== 'hand') return;
    pendingMove.current = { to, revision: session.revision };
    act({ type: 'move', from: selection.index, to });
  };

  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={s.shade}>
      <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal accessibilityLabel={`${card.name} spell details`} style={[s.panel, { maxHeight: height - 48, maxWidth: compact ? 620 : 760, borderTopColor: accent }]}>
        <View style={[s.header,compact&&{paddingVertical:6}]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.eyebrow, { color: accent }]}>{card.domain.toUpperCase()} · {'★'.repeat(card.stars)} · {shop ? 'SHOP SPELL' : 'YOUR SPELL'}</Text>
            <Text accessibilityRole="header" style={[s.title,compact&&{fontSize:24}]}>{card.name}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close spell details" onPress={onClose} style={({ pressed }) => [s.close, pressed && { backgroundColor: '#44382a' }]}><Text style={s.closeText}>×</Text></Pressable>
        </View>
        <View style={s.body}>
          {showArt && <View style={s.art}><View style={{ width: artHeight * 2 / 3, height: artHeight }}><SpellCard {...card} shop={shop} /></View><Text style={[s.caption, { color: accent }]}>{card.upgraded ? '✦ Upgraded spell' : '✦ ' + card.domain[0].toUpperCase() + card.domain.slice(1) + ' magic'}</Text></View>}
          <ScrollView style={s.scroll} contentContainerStyle={[s.details,compact&&{padding:12,gap:10}]}>
            {compact ? <Text style={s.caption}>{castLabel(card.castTicks)} cast · {shop ? `${price} gold` : `${xp}/${UPGRADE_XP} XP`}</Text> : <View style={s.stats}>
              <View style={s.stat}><Text style={s.statValue}>{castLabel(card.castTicks)}</Text><Text style={s.caption}>Cast time</Text></View>
              <View style={s.stat}><Text style={[s.statValue, { color: '#efd088' }]}>{shop ? price : `${xp}/${UPGRADE_XP}`}</Text><Text style={s.caption}>{shop ? 'Gold' : 'Upgrade XP'}</Text></View>
            </View>}
            <View style={[s.effect,compact&&{gap:4}]}><Text style={s.eyebrow}>SPELL EFFECT</Text><RulesText card={card} domains={attunedDomains(session.spells,session.spellAcquired)} rules={card.rules} keywords={card.keywords} fontSize={16} color="#f2e6d0" /></View>
            {!shop && selection.kind === 'hand' && card.keywords.includes('channel') && <Text style={s.caption}>Channel X = {channelPower(session.spells, selection.index)} in this position</Text>}
            <View style={s.upgrade}>
              <View style={s.row}><Text style={s.sectionTitle}>{card.upgraded ? '✦ Fully upgraded' : 'Upgrade'}</Text><Text style={s.caption}>{xp}/{UPGRADE_XP} XP</Text></View>
              <View accessible accessibilityRole="progressbar" accessibilityLabel="Spell upgrade progress" accessibilityValue={{ min: 0, max: UPGRADE_XP, now: xp }} style={s.progress}>{Array.from({ length: UPGRADE_XP }, (_, i) => <View key={i} style={[s.segment, i < xp && { backgroundColor: accent }]} />)}</View>
              {!card.upgraded && card.upgrade && <><Text style={s.upgradeLabel}>AT {UPGRADE_XP} XP</Text><RulesText rules={upgradeSummary(card)} keywords={card.upgrade.keywords} fontSize={14} color="#e9d6ad" /></>}
            </View>
            {card.keywords.length > 0 && <><Pressable accessibilityRole="button" accessibilityState={{ expanded: showKeywords }} onPress={() => setShowKeywords(!showKeywords)} style={s.keywordToggle}><Text style={s.sectionTitle}>Keyword guide</Text><Text style={s.caption}>{showKeywords ? 'Hide −' : 'Show +'}</Text></Pressable>{showKeywords && <KeywordBoxes keywords={card.keywords} />}</>}
            {session.spells.some((owned, i) => shop ? owned === id && (session.spellXp?.[i] ?? 0) < UPGRADE_XP : canMerge(session.spells, session.spellXp ?? [], i, selection.index)) && <View style={{ gap: 8 }}>
              <Text style={s.eyebrow}>{shop ? 'OR UPGRADE AN OWNED COPY' : 'MERGE MATCHING COPIES'}</Text>
              {session.spells.map((owned, i) => (shop ? owned === id && (session.spellXp?.[i] ?? 0) < UPGRADE_XP : canMerge(session.spells, session.spellXp ?? [], i, selection.index)) ?
                <Button key={i} label={shop ? `Buy & merge · Slot ${i + 1} → ${Math.min(3,(session.spellXp?.[i] ?? 0) + 1)}/3 XP · ${price} gold` : `Consume slot ${i + 1} (${session.spellXp?.[i] ?? 0} XP) · Gain 1 XP`}
                  disabled={busy || (shop && session.gold < price)} onPress={() => finish(shop ? { type: 'buy', spell: id, target: i, shopSlot: selection.shopSlot } : { type: 'merge', from: i, to: selection.index })} /> : null)}
            </View>}
          </ScrollView>
        </View>
        <View style={[s.footer,compact&&{paddingVertical:6,gap:4}]}>
          {!!error && <Text accessibilityRole="alert" style={s.warning}>{error}</Text>}
          {shop ? <>
            <View style={s.row}><Text style={s.caption}>Your gold: <Text style={{ color: '#efd088' }}>{session.gold}</Text></Text><Text style={s.caption}>{session.spells.length}/{RULES.slots} spell slots</Text></View>
            {!!purchaseReason && <Text style={s.warning}>{purchaseReason}</Text>}
            <Button primary label={`Buy ${card.name} · ${price} gold`} disabled={busy || !!purchaseReason} onPress={() => finish({ type: 'buy', spell: id, shopSlot: selection.shopSlot })} />
          </> : <>
            <View style={s.row}><Text accessibilityLiveRegion="polite" style={s.caption}>Casting position {selection.index + 1} of {session.spells.length}</Text><Pressable accessibilityRole="button" accessibilityLabel="Trash spell" disabled={busy} onPress={() => setConfirmTrash(!confirmTrash)} style={s.trash}><Text style={{ color: '#dca69b', fontSize: 13 }}>Trash spell</Text></Pressable></View>
            {confirmTrash ? <View style={{ gap: 8 }}><Text style={s.warning}>Remove {card.name} from your hand? {session.augments.includes("recycler")?`You receive ${trashRefund(session.augments,card.stars)} gold.`:"No gold is refunded."}</Text><View style={s.row}><View style={{ flex: 1 }}><Button label="Keep spell" onPress={() => setConfirmTrash(false)} /></View><View style={{ flex: 1 }}><Button danger label="Remove spell" disabled={busy} onPress={() => finish({ type: 'trash', index: selection.index })} /></View></View></View>
              : <View style={s.row}><View style={{ flex: 1 }}><Button label="← Cast earlier" disabled={busy || selection.index === 0} onPress={() => move(selection.index - 1)} /></View><View style={{ flex: 1 }}><Button label="Cast later →" disabled={busy || selection.index === session.spells.length - 1} onPress={() => move(selection.index + 1)} /></View></View>}
          </>}
        </View>
      </View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  shade: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#080604c9' },
  panel: { width: '100%', maxWidth: 800, backgroundColor: '#211c15', borderWidth: 1, borderColor: '#746044', borderTopWidth: 3, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 70px #0009' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#443829' },
  eyebrow: { color: '#b8a88b', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: '#faebc9', fontFamily: serif, fontSize: 30 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#30291f', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#dfceb0', fontSize: 28 },
  body: { flexDirection: 'row', flexShrink: 1, minHeight: 0 },
  art: { padding: 22, gap: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18150f' },
  scroll: { flex: 1, minWidth: 0 },
  details: { padding: 20, gap: 18 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 4, alignItems: 'center', paddingVertical: 10, backgroundColor: '#30291f', borderRadius: 7 },
  statValue: { color: '#efe2c9', fontFamily: serif, fontSize: 22 },
  caption: { color: '#c2b297', fontSize: 12, lineHeight: 18 },
  effect: { gap: 12, paddingVertical: 2 },
  upgrade: { padding: 14, borderWidth: 1, borderColor: '#5a4930', borderRadius: 8, gap: 10, backgroundColor: '#2c251a' },
  sectionTitle: { color: '#ecd6ab', fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#514532' },
  upgradeLabel: { color: '#dfbd77', fontSize: 11, fontWeight: '600' },
  keywordToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, borderBottomWidth: 1, borderBottomColor: '#443829' },
  footer: { paddingHorizontal: 22, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#443829', backgroundColor: '#272117' },
  button: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#353025', borderWidth: 1, borderColor: '#796344', borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: '#28513b', borderColor: '#86ac77', minHeight: 48 },
  danger: { backgroundColor: '#512c26', borderColor: '#976051' },
  buttonText: { color: '#f4e5c7', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: .4 },
  warning: { color: '#edbb96', fontSize: 12, lineHeight: 17 },
  trash: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
});
