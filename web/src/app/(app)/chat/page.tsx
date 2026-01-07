'use client'

import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/chat'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || undefined

  return <ChatInterface initialPrompt={initialPrompt} />
}
