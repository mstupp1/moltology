import { ORACLE_MODELS, getOracleModel } from './oracle-models'

export const GUEST_ORACLE_RESPONSES = [
  "The Oracle sees great potential in you, but you're still in Guest Mode! Create a free account to unlock detailed answers, advice, and save your chat history.",
  'That is a great question! In Guest Mode, my answers are kept brief. Sign up for a free account to unlock full Oracle guidance and start your journey.',
  "I'd love to give you the full breakdown, but you're browsing as a guest. Create your free account in seconds to get complete answers and track your progress!",
  'The answer lies just beneath the surface! In Guest Mode, detailed insights and saved chats are locked. Sign up for free to unlock the full Oracle experience.',
  "You're asking the right questions, but full answers require a free account. Sign up below to unlock complete answers and permanent chat history!",
]

export const ORACLE_UNAVAILABLE_MESSAGE =
  "Sorry — the Oracle couldn't reach a working model right now. Please try again in a moment."

export const ORACLE_THREAD_ID_HEADER = 'X-Oracle-Thread-Id'

export function pickGuestOracleResponse(userText: string, messageCount: number): string {
  const index = Math.abs(userText.length + messageCount) % GUEST_ORACLE_RESPONSES.length
  return GUEST_ORACLE_RESPONSES[index]
}

export function getOracleCandidateModelIds(selectedModelId?: string): string[] {
  const selectedModel = getOracleModel(selectedModelId)
  return [
    selectedModel.id,
    ...ORACLE_MODELS.filter((m) => m.id !== selectedModel.id).map((m) => m.id),
  ]
}

export function formatOracleUnavailableMessage(lastError?: { message?: string } | null): string {
  if (lastError?.message) {
    return `${ORACLE_UNAVAILABLE_MESSAGE} (${lastError.message})`
  }
  return ORACLE_UNAVAILABLE_MESSAGE
}

export interface OracleChatMessageInput {
  role: string
  content?: string
  text?: string
}

export function getLastUserText(messages: OracleChatMessageInput[]): string {
  const lastMsg = messages[messages.length - 1]
  return lastMsg?.content || lastMsg?.text || ''
}

export function toModelMessages(messages: OracleChatMessageInput[]) {
  return messages
    .filter((m) => Boolean((m.content || m.text || '').trim()))
    .map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: (m.content || m.text || '').trim(),
    }))
}

