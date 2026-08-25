import { createFileRoute } from '@tanstack/react-router'
import { handleOracleChatRequest } from '@/lib/ai/handle-oracle-chat-request'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => handleOracleChatRequest(request),
    },
  },
})
