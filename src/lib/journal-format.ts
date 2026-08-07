const SUBSCRIPT_CHARS: Record<string, string> = {
  '0': '\u2080',
  '1': '\u2081',
  '2': '\u2082',
  '3': '\u2083',
  '4': '\u2084',
  '5': '\u2085',
  '6': '\u2086',
  '7': '\u2087',
  '8': '\u2088',
  '9': '\u2089',
  '+': '\u208A',
  '-': '\u208B',
  '=': '\u208C',
  '(': '\u208D',
  ')': '\u208E',
}

const SUPERSCRIPT_CHARS: Record<string, string> = {
  '0': '\u2070',
  '1': '\u00B9',
  '2': '\u00B2',
  '3': '\u00B3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
  '+': '\u207A',
  '-': '\u207B',
  '=': '\u207C',
  '(': '\u207D',
  ')': '\u207E',
}

function toSubscript(segment: string): string {
  return segment
    .split('')
    .map((ch) => SUBSCRIPT_CHARS[ch] ?? ch)
    .join('')
}

function toSuperscript(segment: string): string {
  return segment
    .split('')
    .map((ch) => SUPERSCRIPT_CHARS[ch] ?? ch)
    .join('')
}

/**
 * Converts a small, self-contained LaTeX-ish math expression (between $...$)
 * into plain-text scientific notation using unicode sub/superscripts.
 *
 * Supported: _{} / ^{}, ^\circ, \circ, \pm, \text{--} (en dash), \text{} /
 * \mathrm{}, "~" spacing, and \frac as a/b.
 */
export function convertScienceMath(math: string): string {
  return math
    .replace(/\^\s*\\circ/g, '\u00B0')
    .replace(/\^\{([^}]*)\}/g, (_, seg: string) => toSuperscript(seg))
    .replace(/_\{([^}]*)\}/g, (_, seg: string) => toSubscript(seg))
    .replace(/\^([0-9+\-=()]+)/g, (_, seg: string) => toSuperscript(seg))
    .replace(/_([0-9+\-=()]+)/g, (_, seg: string) => toSubscript(seg))
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\circ/g, '\u00B0')
    .replace(/\\pm/g, '\u00B1')
    .replace(/\\(?:text|mathrm)\{--\}/g, '\u2013')
    .replace(/\\(?:text|mathrm)\{([^}]*)\}/g, '$1')
    .replace(/~+/g, ' ')
    .replace(/^[$$\s]+|[$$\s]+$/g, '')
    .trim()
}

/**
 * Extracts any "[FEEDS: X]" annotations from a paragraph and returns the
 * cleaned display text along with the extracted feed labels.
 */
export function extractFeedTags(raw: string): { text: string; feeds: string[] } {
  const feeds = raw.match(/\[FEEDS:\s*([^\]]+)\]/g) ?? []
  const text = raw.replace(/\[FEEDS:\s*[^\]]+\]/g, '').replace(/\s{2,}/g, ' ').trim()
  return {
    text,
    feeds: feeds.map((f) => f.replace(/^\[FEEDS:\s*/, '').replace(/\]$/, '').trim()),
  }
}

/**
 * Renders a journal paragraph's inline syntax into HTML: converts $...$ math
 * and **bold** segments. Feed tags are expected to have been stripped already.
 * `boldClass` lets themes control the strong tag styling (default targets the
 * dark HUD chrome; paper themes should pass a color-free class like 'font-bold').
 */
export function formatJournalInline(raw: string, boldClass = 'text-[#e8f6ff] font-bold'): string {
  return raw
    .replace(/\$([^$]+)\$/g, (_, math: string) => convertScienceMath(math))
    .replace(/\*\*(.*?)\*\*/g, `<strong class="${boldClass}">$1</strong>`)
    .replace(/\\n/g, ' ')
    .trim()
}
