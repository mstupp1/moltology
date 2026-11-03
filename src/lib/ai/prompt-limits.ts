/** Per-message limits; membership is verified on the server before screening. */
export const ORACLE_FREE_PROMPT_MAX_CHARS = 1_500
export const ORACLE_MAX_PROMPT_MAX_CHARS = 4_000

export function getOraclePromptMaxChars(isPremium: boolean): number {
  return isPremium ? ORACLE_MAX_PROMPT_MAX_CHARS : ORACLE_FREE_PROMPT_MAX_CHARS
}

export function getOraclePromptLengthError(text: string, isPremium: boolean): string | null {
  const limit = getOraclePromptMaxChars(isPremium)
  if (text.trim().length <= limit) return null
  return `${isPremium ? 'Oracle MAX' : 'Free Oracle'} messages can contain up to ${limit.toLocaleString('en-US')} characters. Shorten your message to send it.`
}
