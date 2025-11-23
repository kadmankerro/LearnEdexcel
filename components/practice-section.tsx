"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, FileText, Brain } from "lucide-react"
import { useState } from "react"

export function PracticeSection() {
  const [showQuestion, setShowQuestion] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const sampleQuestion = {
    question: "Which of the following best describes the concept of opportunity cost in economics?",
    options: [
      "The monetary cost of producing a good or service",
      "The value of the next best alternative foregone when making a decision",
      "The total cost of all resources used in production",
      "The difference between revenue and expenses",
    ],
    correctAnswer: 1,
    explanation:
      "Opportunity cost is the value of the next best alternative that must be foregone when making a choice. It represents what you give up to get something else.",
  }

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index)
    setShowFeedback(true)
  }

  return (
    <section id="practice" className="border-b border-border bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">Practice Makes Perfect</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            {"Access thousands of practice questions with instant AI feedback"}
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {!showQuestion ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <Card
                className="group cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setShowQuestion(true)}
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Adaptive Practice</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {"Questions that adjust to your level for optimal learning"}
                  </p>
                  <Button className="w-full">Start Practice Session</Button>
                </CardContent>
              </Card>

              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">Past Papers</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {"Real Edexcel exam papers with instant AI marking"}
                  </p>
                  <Button variant="secondary" className="w-full">
                    Browse Past Papers
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Economics • Markets</span>
                    <span className="text-sm text-muted-foreground">Question 1 of 10</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[10%] bg-primary" />
                  </div>
                </div>

                <h3 className="mb-6 text-lg font-semibold text-card-foreground">{sampleQuestion.question}</h3>

                <div className="mb-6 space-y-3">
                  {sampleQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = index === sampleQuestion.correctAnswer
                    const showCorrect = showFeedback && isCorrect
                    const showIncorrect = showFeedback && isSelected && !isCorrect

                    return (
                      <button
                        key={index}
                        onClick={() => !showFeedback && handleAnswerSelect(index)}
                        disabled={showFeedback}
                        className={`w-full rounded-lg border p-4 text-left transition-all ${
                          showCorrect
                            ? "border-secondary bg-secondary/10"
                            : showIncorrect
                              ? "border-destructive bg-destructive/10"
                              : isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card hover:border-primary hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-card-foreground">{option}</span>
                          {showCorrect && <CheckCircle2 className="h-5 w-5 text-secondary" />}
                          {showIncorrect && <XCircle className="h-5 w-5 text-destructive" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {showFeedback && (
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <p className="mb-2 font-semibold text-card-foreground">
                      {selectedAnswer === sampleQuestion.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground">{sampleQuestion.explanation}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuestion(false)
                      setSelectedAnswer(null)
                      setShowFeedback(false)
                    }}
                  >
                    Exit Practice
                  </Button>
                  {showFeedback && (
                    <Button
                      onClick={() => {
                        setSelectedAnswer(null)
                        setShowFeedback(false)
                      }}
                    >
                      Next Question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
