import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'physicality',
  topic: 'Physicality',
  kit: 'locker',
  variant: 'track-club',
  query: 'mind body connection',
  title: 'Mind body connection. Check in before you start | Moltology',
  description:
    'Put mind body connection on the training card. Pause before the inbox, notice your surroundings, and talk daily habits on the Moltology forum.',
  keywords: 'mind body connection, physical awareness, screen habits, daily check-in',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology offers daily habits and community discussion, not medical care or an exercise plan.',
  shareImage: {
    src: '/images/benefits/physicality/share.jpg?v=2',
    alt: 'A glossy crab beside a gym locker in a tightly cropped sportswear photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Moltmaxxing & Biometrics',
    href: '/forum/moltmaxxing-biometrics',
    text: 'Bring a specific question or a few training notes to the forum.',
  },
  reveal: {
    headline: 'Clock in with your whole self.',
    body: 'Fit a quiet check-in between two blocks of work.',
    screenshot: 'dashboard',
  },
  related: ['movement', 'fitness', 'focus'],
  faqs: [
    {
      question: 'What does mind body connection mean?',
      answer:
        'Mind body connection means the relationship between your thoughts, feelings and physical experience. An everyday example is noticing your shoulders tense while reading a difficult email. Start by naming what you notice, without guessing at a cause.',
    },
    {
      question: 'How can I practice mind body connection at a desk?',
      answer:
        'Pause and check what is happening around you and in your body. Notice the chair, the noise, and whether lunch is still sitting unopened beside the keyboard. A quiet minute before you open the inbox is a good place to try it.',
    },
    {
      question: 'Is a body awareness journal necessary?',
      answer:
        'No. A short note is enough if you want to discuss a pattern. Write the activity and the detail you noticed: reading a long report, gripping the mouse, or ignoring the room while checking messages. Skip the elaborate scoring system.',
    },
    {
      question: 'Where can I talk about daily habits and physical awareness?',
      answer:
        'The Moltmaxxing & Biometrics forum board is the place for that discussion. Share a clear question and your own experience. If you are replying, ask what the person has already tried before recommending your entire morning routine.',
    },
    {
      question: 'Should I check how I feel after every task?',
      answer:
        'No. You can notice something and carry on with your day. Keep a check-in brief enough to fit the moment. There is no need to write a report every time you leave the desk or put your phone down.',
    },
    {
      question: 'What should I include when posting about my routine?',
      answer:
        'Include what you were doing, what interrupted it, and the question you want answered. Leave private details out. A post about checking messages through dinner gives the board something clearer to discuss than a request to fix your whole schedule.',
    },
  ],
  content: {
    hero: {
      tag: 'Daily check-in · zero equipment',
      headline: 'Mind-body connection. Check in before you clock in.',
      sub: 'Take lunch away from the keyboard. Notice how you’re sitting before the next session.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/physicality/hero.jpg?v=2',
        alt: 'A lobster pausing by a training bench under hard side lighting in a black and volt sportswear shoot',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'Training starts at the desk',
      intro: 'Four check-ins and work blocks from the daily practice.',
      items: [
        { set: 'Arrival', title: 'Sit in silence', body: 'Leave the phone face down. Sit quietly and look back at yesterday before adding fresh messages to the morning.' },
        { set: 'Break', title: 'Reset your focus', body: 'Check the space around the work. Clear a distraction and decide what to do when you return to it.' },
        { set: 'Work block', title: 'Do deep work', body: 'Put the chosen task in front of you. Silence the interruptions you can control and keep the extra windows closed.' },
        { set: 'Clock out', title: 'Close the day', body: 'Tick off what you did and finish the check-in. Put the device down when you close the day.' },
      ],
    },
    gear: {
      title: 'Check your setup',
      intro: 'The desk counts as part of the session. Take a look before opening another window.',
      items: ['A phone or computer for the tasks and forum', 'A spot where you can sit quietly before the inbox', 'One everyday detail to bring to the board'],
      image: {
        src: '/images/benefits/physicality/tape.jpg?v=2',
        alt: 'A crab resting a claw beside athletic tape on a locker bench in a vertical sports equipment photograph',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
