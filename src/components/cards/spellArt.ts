import type { ImageSourcePropType } from 'react-native';
// Static asset registry shared by cards, timeline and combat icons.
export const SPELL_ART: Record<string, ImageSourcePropType> = {
  'celestial-alignment': require('../../../assets/nature/Celestial Alignment.png'),
  'flourish': require('../../../assets/nature/Florish.png'),
  'germination': require('../../../assets/nature/Germination.png'),
  'lifebloom': require('../../../assets/nature/Lifebloom.png'),
  'lunar-strike': require('../../../assets/nature/Lunar Strike.png'),
  'moon-blast': require('../../../assets/nature/Moon Blast.png'),
  'moonfire': require('../../../assets/nature/Moonfire.png'),
  'photosynthesis': require('../../../assets/nature/Photosynthesis.png'),
  'regrowth': require('../../../assets/nature/Regrowth.png'),
  'rejuvenation': require('../../../assets/nature/Rejuvenation.png'),
  'renew': require('../../../assets/nature/Renew.png'),
  'root-bind': require('../../../assets/nature/Root Bind.png'),
  'sap': require('../../../assets/nature/Sap.png'),
  'seed-shot': require('../../../assets/nature/Seed Shot.png'),
  'starfall': require('../../../assets/nature/Starfall.png'),
  'starsurge': require('../../../assets/nature/Starsurge.png'),
  'sunfire': require('../../../assets/nature/Sunfire.png'),
  'wrath': require('../../../assets/nature/Wrath.png'),
};
// Effects with dedicated spell artwork; generic effects keep their symbol.
export const STATUS_ART: Record<string, ImageSourcePropType> = {
  moonfire: SPELL_ART.moonfire, sunfire: SPELL_ART.sunfire, starfall: SPELL_ART.starfall, lifebloom: SPELL_ART.lifebloom,
};
