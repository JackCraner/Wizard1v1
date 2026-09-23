import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GameApp } from './src/GameApp';
import { LocalGameGateway } from './src/services/localGateway';
import { combatPreviewGateway, COMBAT_FIXTURES } from './src/game/combatFixtures';
import { useState } from 'react';
import { View } from 'react-native';
import { LocalMultiplayer, hasLocalInvitation } from './src/screens/LocalMultiplayer';

// Swap this adapter for an HTTP/WebSocket implementation when the server exists.
const preview=__DEV__&&typeof window!=='undefined'?new URLSearchParams(window.location.search).get('combat-lab'):null;
const normalGateway = preview&&preview in COMBAT_FIXTURES?combatPreviewGateway(preview as keyof typeof COMBAT_FIXTURES):new LocalGameGateway();

const rewardGateway = new LocalGameGateway();
const gateway = __DEV__ && typeof window !== 'undefined' && window.location.search.includes('augment-style-check') ? {
  async start() {
    let s = await rewardGateway.start();
    s = await rewardGateway.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});
    for (let r=0;r<2;r++) {
      s = await rewardGateway.execute(s.id,s.revision,{type:'fight'});
      s = await rewardGateway.execute(s.id,s.revision,{type:'next'});
    }
    return s;
  },
  execute: rewardGateway.execute.bind(rewardGateway),
} : normalGateway;
export default function App() {
  const [multiplayer, setMultiplayer] = useState(hasLocalInvitation);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, display: multiplayer ? 'none' : 'flex' }}><GameApp gateway={gateway} visible={!multiplayer} onMultiplayer={() => setMultiplayer(true)} /></View>
      {multiplayer && <LocalMultiplayer onBack={() => setMultiplayer(false)} />}
    </SafeAreaProvider>
  );
}

