/**
 * Shared secret-leak and explicit-harm detectors for forum posts and AI input.
 * Keep this conservative: high-precision patterns only, not a full classifier.
 */

export const CONTENT_SECRET_ERROR =
  'Content appears to contain sensitive information such as API keys, passwords, or connection strings.'

export const CONTENT_HARM_ERROR =
  'This content is not allowed. Do not post requests for real-world harm or illegal activity.'

const SECRET_LEAK_PATTERNS: RegExp[] = [
  /(?:^|[\s"'`])bearer\s+[a-z0-9_\-.]{20,}/i,
  /postgres(?:ql)?:\/\/[^\s]+/i,
  /\bsk-[a-zA-Z0-9]{20,}/,
  /\bghp_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\baws_secret_access_key\b/i,
]

const HARM_PATTERNS: RegExp[] = [
  /\b(self[- ]harm|suicide|how to make bomb|explosives|illegal weapons)\b/i,
  /\b(kill yourself|kys)\b/i,
]

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

export function containsSecretLeak(text: string): boolean {
  return SECRET_LEAK_PATTERNS.some((pattern) => pattern.test(text))
}

export function containsHarmfulContent(text: string): boolean {
  return HARM_PATTERNS.some((pattern) => pattern.test(text))
}

export function stripControlChars(text: string): string {
  return text.replace(CONTROL_CHARS, '')
}
