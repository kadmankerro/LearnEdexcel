"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { X, Send, Sparkles, TrendingDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AiTutorSidebar({
  userId,
  topicId,
  onClose,
}: {
  userId: string
  topicId: number
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI tutor. I can help you understand topics, explain concepts, and suggest areas to focus on based on your performance. What would you like to know?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [weakTopics, setWeakTopics] = useState<Array<{ topic_code: string; title: string }>>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadWeakTopics()
  }, [userId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadWeakTopics = async () => {
    const { data } = await supabase
      .from("user_weak_topics")
      .select(
        `
        topics:topic_id(topic_code, title)
      `,
      )
      .eq("user_id", userId)
      .order("weakness_score", { ascending: false })
      .limit(3)

    if (data) {
      const topics = data.map((d: any) => d.topics).filter(Boolean)
      setWeakTopics(topics)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          userId,
          topicId,
          weakTopics,
        }),
      })

      const data = await response.json()

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])

      // Save conversation to database
      await supabase.from("tutor_sessions").insert({
        user_id: userId,
        message: userMessage,
        response: data.response,
        context: { topicId, weakTopics },
      })
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l border-border bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold">AI Tutor</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Weak Topics Suggestions */}
      {weakTopics.length > 0 && (
        <div className="border-b border-border bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <TrendingDown className="h-4 w-4 text-yellow-600" />
            Topics to review:
          </div>
          <div className="space-y-1">
            {weakTopics.map((topic, i) => (
              <button
                key={i}
                className="w-full rounded-md bg-background px-3 py-2 text-left text-xs hover:bg-accent"
                onClick={() => setInput(`Can you help me understand ${topic.topic_code} - ${topic.title}?`)}
              >
                {topic.topic_code} - {topic.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-[85%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <div className="p-3 text-sm">{message.content}</div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-muted">
                <div className="p-3 text-sm">Thinking...</div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
