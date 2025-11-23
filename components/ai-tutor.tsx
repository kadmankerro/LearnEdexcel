"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles } from "lucide-react"
import { useState } from "react"

const sampleQuestions = [
  "Explain the law of diminishing marginal returns",
  "What are the key differences between left and right wing ideologies?",
  "How does the marketing mix apply to real businesses?",
]

export function AiTutor() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([])

  const handleSendQuestion = () => {
    if (!question.trim()) return

    setMessages([
      ...messages,
      { role: "user", content: question },
      {
        role: "ai",
        content:
          "This is a demo. In the full version, the AI tutor would provide a detailed explanation here, breaking down complex concepts into easy-to-understand steps with examples from your Edexcel curriculum.",
      },
    ])
    setQuestion("")
  }

  return (
    <section id="ai-tutor" className="border-b border-border bg-background py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Ask Your AI Tutor Anything
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            {"Get instant, detailed explanations for any topic or question - available 24/7"}
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card className="mb-6">
            <CardContent className="p-6">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-8">
                    <div className="text-center">
                      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                        <Sparkles className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-card-foreground">Start a conversation</h3>
                      <p className="text-sm text-muted-foreground">{"Try asking a question or pick one below"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Popular questions:</p>
                    <div className="flex flex-col gap-2">
                      {sampleQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setQuestion(q)}
                          className="rounded-lg border border-border bg-card p-3 text-left text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-muted text-muted-foreground mr-8"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Input
              placeholder="Ask any question about Economics, Politics, or Business..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
              className="flex-1"
            />
            <Button onClick={handleSendQuestion} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
