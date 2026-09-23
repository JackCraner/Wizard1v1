import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GameApp } from './src/GameApp';
import { LocalGameGateway } from './src/services/localGateway';
import { combatPreviewGateway, COMBAT_FIXTURES } from './src/game/combatFixtures';

// Swap this adapter for an HTTP/WebSocket implementation when the server exists.
const preview=__DEV__&&typeof window!=='undefined'?new URLSearchParams(window.location.search).get('combat-lab'):null;
const gateway = preview&&preview in COMBAT_FIXTURES?combatPreviewGateway(preview as keyof typeof COMBAT_FIXTURES):new LocalGameGateway();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameApp gateway={gateway} />
    </SafeAreaProvider>
  );
}
