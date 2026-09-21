import { DifficultyPicker } from './screens/DifficultyPicker';
import { TournamentResult } from './screens/TournamentResult';
import { CardLibrary } from './screens/CardLibrary';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GameGateway } from './game/model';
import { useGame } from './useGame';
import { useOrientation } from './useOrientation';
import { Body, Button, Eyebrow, Heading, Panel, styles as s, Title } from './ui';
import { ShopScreen } from './screens/ShopScreen';
import { CombatScreen } from './screens/CombatScreen';
import { MainMenu } from './screens/MainMenu';

export function GameApp({ gateway }: { gateway: GameGateway }) {
  const game = useGame(gateway);
  const [choosingDifficulty,setChoosingDifficulty]=useState(false);
  const [library, setLibrary] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const orientationError = useOrientation(game.screen === 'game' || library);
  const wide = width >= 800;

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [game.screen, game.session?.phase]);

  if(choosingDifficulty)return <DifficultyPicker busy={game.busy} onCancel={()=>setChoosingDifficulty(false)} onStart={difficulty=>{setChoosingDifficulty(false);game.start(difficulty);}} />;

  if (library) return <CardLibrary onClose={() => setLibrary(false)} />;

  // The menu is intentionally outside the scrolling gameplay layout.
  if (game.screen === 'menu') {
    return <MainMenu hasRun={!!game.session} busy={game.busy} round={game.session?.round}
      onLibrary={() => setLibrary(true)} error={game.error} onNewGame={()=>setChoosingDifficulty(true)} onContinue={() => game.setScreen('game')} />;
  }

  if (game.screen === 'game' && width < height) {
    return <SafeAreaView style={[s.safe, { justifyContent: 'center', padding: 28, gap: 20 }]}>
      <Title>Turn to landscape</Title>
      <Body>{orientationError || 'Shopping and combat use a landscape layout. Rotate your device or widen the preview window.'}</Body>
      <Button title="← Main menu" onPress={() => game.setScreen('menu')} />
    </SafeAreaView>;
  }

  if (game.screen === 'game' && game.session?.phase === 'shop') {
    return <ShopScreen key={game.session.id} session={game.session} busy={game.busy} act={game.act}
      onLibrary={() => setLibrary(true)} error={game.error} onMenu={() => game.setScreen('menu')} />;
  }

  if(game.screen==='game'&&game.finished&&game.session?.lobby.finished)return <TournamentResult key={game.session.id} session={game.session} onNewGame={()=>setChoosingDifficulty(true)} onMenu={()=>game.setScreen('menu')} busy={game.busy} error={game.error} />;

  if (game.screen === 'game' && game.session?.battle) return <CombatScreen game={game} />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView ref={scroll} contentContainerStyle={s.scroll}>
        <View style={s.container}>
          <View style={s.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Wizard 1v1 main menu" onPress={() => game.setScreen('menu')} style={{ paddingVertical: 8 }}>
              <Text style={s.brand}>✦ WIZARD 1V1</Text>
            </Pressable>
            <Text style={s.tag}>LOCAL PLAY</Text>
          </View>

          <Button secondary title="← Main menu" onPress={() => game.setScreen('menu')} />

          {game.screen === 'guide' && <>
            <Eyebrow>THE FIELD GUIDE</Eyebrow>
            <Title>Think ahead.{'\n'}Cast in order.</Title>
            {[
              ['01 / Shop', 'Start with an empty hand and 10 gold. Buy spells for up to ten slots. Duplicate spells are allowed. Unspent gold carries over, and each new round adds 10 gold.'],
              ['02 / Arrange', 'Use the arrows to arrange your spells. Both fighters cast simultaneously from first slot to last, then repeat. Once combat begins, the order is locked.'],
              ['03 / Battle', 'Every duel starts at 500 health and 100 mana. Mana does not regenerate. Unaffordable spells are skipped; Wrath is free. Healing and shields resolve before damage.'],
              ['04 / Repeat', 'Bring the opponent to zero health to win. Combat ends after 50 ticks: the lower health total loses; equal health is a draw. Return to the shop to refine your spell order.'],
            ].map(([title, body]) => <Panel key={title}><Heading>{title}</Heading><Body>{body}</Body></Panel>)}
            <Button title="Enter practice grounds" disabled={game.busy} onPress={()=>setChoosingDifficulty(true)} />
            <Body>Runs are kept in memory. Reloading or restarting the app starts fresh.</Body>
          </>}

          {game.screen === 'game' && game.session && <>
            <Eyebrow>PRACTICE GROUNDS · ROUND {game.session.round}</Eyebrow>
            <CombatScreen game={game} />
          </>}
          {!!game.error && <View style={s.error} accessibilityRole="alert"><Text style={{ color: '#ffd6cb' }}>{game.error}</Text></View>}
          <Text style={s.footer}>WIZARD 1V1 · LOCAL PROTOTYPE · v0.2</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

