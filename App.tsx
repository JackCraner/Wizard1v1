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
const gateway = preview&&preview in COMBAT_FIXTURES?combatPreviewGateway(preview as keyof typeof COMBAT_FIXTURES):new LocalGameGateway();

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
