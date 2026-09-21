import type { ImageSourcePropType } from 'react-native';
// Add a static require when artwork is ready; missing entries intentionally render no art.
export const SPELL_ART: Record<string, ImageSourcePropType> = {
  'seed-shot': require('../../../assets/nature/seed-shot.png'),
};
