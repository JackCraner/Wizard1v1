import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GameApp } from './src/GameApp';
import { LocalGameGateway } from './src/services/localGateway';

// Swap this adapter for an HTTP/WebSocket implementation when the server exists.
const gateway = new LocalGameGateway();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameApp gateway={gateway} />
    </SafeAreaProvider>
  );
}
