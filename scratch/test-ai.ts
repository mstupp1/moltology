import { sendChatMessageHandler } from '../src/lib/server/api'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function main() {
  console.log('Testing sendChatMessageHandler...')
  try {
    const res = await sendChatMessageHandler({
      data: {
        messages: [{ role: 'user', content: 'What is the Prime Directive?' }],
        userId: 'test-user-1',
      },
      context: {},
    })
    console.log('FINAL RESULT:', JSON.stringify(res, null, 2))
  } catch (err: any) {
    console.error('ERROR:', err)
  }
}

main()
