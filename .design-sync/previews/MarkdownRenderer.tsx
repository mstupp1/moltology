import React from 'react'
import { MarkdownRenderer } from '@moltology/hud'

const Deep = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#030708] p-6 text-[#dfe3e3] font-sans">{children}</div>
)

const reply = [
  '## Your first week',
  '',
  'Start small. Shedding is a practice, not an event.',
  '',
  '1. **Audit the noise.** List every app that pinged you today.',
  '2. **Silence one channel.** Just one. You will not miss it.',
  '3. **Log the shed** so your *Shell Hardness* reflects it.',
  '',
  '> The shell protects; it never cages.',
  '',
  '| Metric | Today |',
  '| --- | --- |',
  '| Shell Hardness | 61% |',
  '| Abyssal Depth | 42 min |',
].join('\n')

const checklist = [
  'Here is the routine as a checklist you can paste anywhere:',
  '',
  '```',
  'Morning:  close tabs, silence one channel',
  'Evening:  log the shed, two-line audit',
  '```',
  '',
  '- Close the tabs you are not using',
  '- Finish one thing you started yesterday',
  '',
  'Use `Log a shed` on the dashboard when you are done.',
].join('\n')

export const Response = () => (
  <Deep><div className="w-[560px]"><MarkdownRenderer content={reply} /></div></Deep>
)

export const CodeBlock = () => (
  <Deep><div className="w-[560px]"><MarkdownRenderer content={checklist} /></div></Deep>
)
