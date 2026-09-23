import { DeviceEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { RoomAuthority } from './roomAuthority';
import type { RoomReply, RoomTransport } from './protocol';

export interface HostInfo {
  origin: string; addresses: string[]; invite: string; hostToken: string; guestToken: string; seed: number;
  ssid?: string; password?: string;
}
interface NativeHost {
  start(hotspot: boolean): Promise<HostInfo>;
  stop(): Promise<void>;
  respond(id: string, response: string): void;
}
const nativeHost: NativeHost | undefined = NativeModules.LocalMultiplayer;
export const canHostOnPhone = Platform.OS === 'android' && !!nativeHost;

export async function startPhoneHost(hotspot: boolean): Promise<{ info: HostInfo; transport: RoomTransport; stop: () => Promise<void> }> {
  if (!nativeHost) throw new Error('Hosting needs the installed Android app.');
  if (hotspot) {
    const permission = Number(Platform.Version) >= 33 ? PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES : PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    if (await PermissionsAndroid.request(permission) !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Wi-Fi permission is needed to create the hotspot. You can host on existing Wi-Fi instead.');
  }
  let authority: RoomAuthority | undefined;
  const listener = DeviceEventEmitter.addListener('LocalMultiplayerRequest', async (event: { id: string; body: string }) => {
    let reply: RoomReply;
    try {
      if (!authority) throw new Error('The host is still preparing. Try again.');
      reply = { ok: true, snapshot: await authority.handle(JSON.parse(event.body)) };
    } catch (error) { reply = { ok: false, error: error instanceof Error ? error.message : 'Invalid request.' }; }
    nativeHost.respond(event.id, JSON.stringify(reply));
  });
  try {
    const info = await nativeHost.start(hotspot);
    authority = new RoomAuthority(info);
    return { info, transport: { request: request => authority!.handle(request) }, stop: async () => { listener.remove(); await nativeHost.stop(); } };
  } catch (error) { listener.remove(); await nativeHost.stop(); throw error; }
}
