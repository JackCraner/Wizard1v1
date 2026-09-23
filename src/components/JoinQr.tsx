import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import qrcode from 'qrcode-generator';

export function JoinQr({ value, size = 154, label }: { value: string; size?: number; label: string }) {
  const code = useMemo(() => {
    const qr = qrcode(0, 'M'); qr.addData(value, 'Byte'); qr.make();
    const count = qr.getModuleCount();
    const path: string[] = [];
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (qr.isDark(y, x)) path.push(`M${x + 4} ${y + 4}h1v1h-1z`);
    return { count: count + 8, path: path.join('') };
  }, [value]);
  return <View accessible accessibilityLabel={label}><Svg width={size} height={size} viewBox={`0 0 ${code.count} ${code.count}`}><Rect width={code.count} height={code.count} fill="#fff" /><Path d={code.path} fill="#000" /></Svg></View>;
}
