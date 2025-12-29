"use client"

import { use } from "react"
import { ChatInterface } from "@/components/chat"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default function ChatConversationPage({ params }: ChatPageProps) {
  const { id } = use(params)
  return <ChatInterface conversationId={id} />
}
