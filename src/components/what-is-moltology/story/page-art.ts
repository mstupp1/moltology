import { getAssetUrl } from '@/lib/assets'
import type { StoryImage } from './content'

// Dedicated About-page artwork. Hero mobile files are separately composed portraits;
// inline images and quiet backgrounds use smaller exports of the same composition.
const image = (name: string, mobile = `${name}-sm`): StoryImage => ({
  src: getAssetUrl(`/images/about/20261023/${name}.png`),
  srcSm: getAssetUrl(`/images/about/20261023/${mobile}.png`),
})

export const PAGE_ART = {
  beliefsHero: image('beliefs-hero-desktop', 'beliefs-hero-mobile'),
  voicesHero: image('voices-hero-desktop', 'voices-hero-mobile'),
  truthRefuge: image('truth-depth'),
  truthNature: image('truth-harden'),
  truthShedding: image('truth-shed'),
  practices: image('practices-bg'),
  codes: image('community-codes'),
  featuredVoice: image('voices-feature'),
  firstRite: image('first-rite-bg'),
} satisfies Record<string, StoryImage>
