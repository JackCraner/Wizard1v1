export function wifiInvitation(ssid: string, password: string) {
  const escape = (s: string) => s.replace(/[\\;,:\"]/g, '\\$&');
  return `WIFI:T:WPA;S:${escape(ssid)};P:${escape(password)};;`;
}
export function gameInvitation(origin: string, invite: string) { return `${origin}/#join=${encodeURIComponent(invite)}`; }
export function parseInvitation(value: string) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use the game link shown on the host phone.');
  const invite = new URLSearchParams(url.hash.slice(1)).get('join');
  if (!invite || invite.length > 200) throw new Error('This link has no room invitation.');
  return { origin: url.origin, invite };
}
