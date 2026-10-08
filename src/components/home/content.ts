import { getAssetUrl } from '@/lib/assets'
import { MEMBER_VOICES, type MemberVoice, type StoryImage } from '@/components/what-is-moltology/story/content'

/**
 * Homepage copy. The homepage only introduces the world and hands the long version to the
 * About pages, so every section here ends in a way in (join, demo, diagnostic) or a link out.
 */

/** Small, familiar moments of the melt. Lit one at a time as the list scrolls past. */
export const HOME_MELT_MOMENTS = [
  'You sat down to do one thing. Now there are nine tabs open and none of them is the thing.',
  'A notification asked for thirty seconds. It got the afternoon.',
  'The task you have been about to start since Monday.',
  'Midnight. Still scrolling. Not even enjoying it.',
] as const

export interface HomeReading {
  id: string
  name: string
  plain: string
  body: string
  image: StoryImage
  accent: string
}

/** The three things a shell is made of, each said in plain words first. */
export const HOME_READINGS: HomeReading[] = [
  {
    id: 'hardness',
    name: 'Shell Hardness',
    plain: 'Boundaries that hold',
    body: 'The group chat can catch fire and your afternoon stays yours.',
    image: {
      src: getAssetUrl('/images/home/home_reading_shell.webp'),
      srcSm: getAssetUrl('/images/home/home_reading_shell_sm.webp'),
    },
    accent: '#00c3ff',
  },
  {
    id: 'torque',
    name: 'Pincer Torque',
    plain: 'A grip that finishes',
    body: 'Pick one thing up and keep hold of it until it is done.',
    image: {
      src: getAssetUrl('/images/home/home_reading_grip.webp'),
      srcSm: getAssetUrl('/images/home/home_reading_grip_sm.webp'),
    },
    accent: '#ff6358',
  },
  {
    id: 'depth',
    name: 'Submergence Depth',
    plain: 'Focus that goes deep',
    body: 'Ten quiet minutes become forty. Forty become a whole morning.',
    image: {
      src: getAssetUrl('/images/home/home_reading_depth.webp'),
      srcSm: getAssetUrl('/images/home/home_reading_depth_sm.webp'),
    },
    accent: '#00ffcc',
  },
]

export interface HomeStep {
  id: string
  title: string
  body: string
  screenshot: StoryImage
  screenshotAlt: string
  url: string
  actionText: string
  actionRoute: string
}

/** How a visitor goes from curious to member, shown with the real screens. */
export const HOME_STEPS: HomeStep[] = [
  {
    id: 'diagnostic',
    title: 'Find your starting point',
    body: 'Take the free Moltmax diagnostic. Fifteen quick scenarios, about four minutes, and no account needed. You get a score and three next steps.',
    screenshot: {
      src: getAssetUrl('/images/marketing/moltmax_feature_preview.webp'),
      srcSm: getAssetUrl('/images/marketing/moltmax_feature_preview_sm.webp'),
    },
    screenshotAlt: 'A Moltmax diagnostic question with four answers to choose from',
    url: 'moltology.org/moltmax',
    actionText: 'Take the diagnostic',
    actionRoute: '/moltmax',
  },
  {
    id: 'dashboard',
    title: 'Shed one small thing a day',
    body: 'Your dashboard opens on today’s routine: eight small tasks, the lesson you were halfway through, and a streak that makes progress easy to see.',
    screenshot: {
      src: getAssetUrl('/images/marketing/dashboard_feature_preview.webp'),
      srcSm: getAssetUrl('/images/marketing/dashboard_feature_preview_sm.webp'),
    },
    screenshotAlt: 'The dashboard with a featured lesson and community news',
    url: 'moltology.org/dashboard',
    actionText: 'Try the demo',
    actionRoute: '/dashboard',
  },
  {
    id: 'oracle',
    title: 'Ask when you are stuck',
    body: 'When a task feels too big or your head is too loud, the Oracle helps you find the first step and shape a routine around the week you actually have.',
    screenshot: {
      src: getAssetUrl('/images/marketing/oracle_feature_preview.webp'),
      srcSm: getAssetUrl('/images/marketing/oracle_feature_preview_sm.webp'),
    },
    screenshotAlt: 'A new conversation with the Oracle',
    url: 'moltology.org/oracle',
    actionText: 'Ask the Oracle',
    actionRoute: '/oracle',
  },
  {
    id: 'community',
    title: 'Keep going together',
    body: 'Share your progress, borrow routines that worked for other members, and get encouragement on boards that are moderated to stay kind.',
    screenshot: {
      src: getAssetUrl('/images/marketing/forum_feature_preview.webp'),
      srcSm: getAssetUrl('/images/marketing/forum_feature_preview_sm.webp'),
    },
    screenshotAlt: 'The community boards and latest posts',
    url: 'moltology.org/forum',
    actionText: 'Visit the community',
    actionRoute: '/forum',
  },
]

const HOME_VOICE_NAMES = ['Shallow Reef 4', 'Pressure Hull', 'Brine Circuit'] as const

/** Three member voices chosen for a first visit: small wins, told plainly. */
export const HOME_VOICES: MemberVoice[] = HOME_VOICE_NAMES.map((name) => {
  const voice = MEMBER_VOICES.find((v) => v.name === name)
  if (!voice) throw new Error(`Missing member voice: ${name}`)
  return voice
})

export interface HomeQuestion {
  question: string
  answer: string
}

/** The questions people have right before they join. Answers are plain and true. */
export const HOME_FAQ: HomeQuestion[] = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. Joining, the daily routine, the diagnostic, the community, and the Oracle are all free. Premium and Molt Credits are optional extras, such as more time with the Oracle, cosmetics, and premium guides. Progress and rank cannot be bought.',
  },
  {
    question: 'How much time does it take?',
    answer:
      'The daily routine is eight small tasks, built to survive busy weeks. Do the ones that fit today. Most people start with one.',
  },
  {
    question: 'Do I need to know the lore?',
    answer:
      'No. Start with the diagnostic and the daily routine. The scripture is there when you get curious, and plenty of members end up reading all of it in one night.',
  },
  {
    question: 'Can I look around before I sign up?',
    answer:
      'Yes. The demo opens the full dashboard as a guest. Make an account when you want to keep your progress.',
  },
  {
    question: 'What is the community like?',
    answer:
      'Warm, and moderated to stay that way. The first rule of the forum is that newcomers are welcomed, never mocked. Everyone here started soft.',
  },
]

export const HOME_FINAL_IMAGE: StoryImage = {
  src: getAssetUrl('/images/home/home_final_descent.webp'),
  srcSm: getAssetUrl('/images/home/home_final_descent_sm.webp'),
}
