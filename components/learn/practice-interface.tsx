"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, BookOpen, Highlighter, Send, ChevronLeft, ChevronRight, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AiTutorSidebar } from "./ai-tutor-sidebar"
import { useRouter } from "next/navigation"

interface Question {
  id: number
  question_text: string
  question_type: string
  difficulty: string
  marks: number
  correct_answer: string
  explanation: string
  mark_scheme: string
  question_options?: Array<{
    id: number
    option_text: string
    is_correct: boolean
  }>
}

interface Topic {
  id: number
  topic_code: string
  title: string
  content: string
  themes: {
    title: string
    subjects: {
      name: string
      code: string
    }
  }
}

interface PreviousAnswer {
  question_id: number
  answer_text: string
  highlighted_text: string[]
  marks_awarded: number
  ai_feedback: string
}

export function PracticeInterface({
  topic,
  questions,
  previousAnswers,
  userId,
  subjectCode,
}: {
  topic: Topic
  questions: Question[]
  previousAnswers: PreviousAnswer[]
  userId: string
  subjectCode: string
}) {
  const router = useRouter()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{ start: number; end: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedAnswer, setSubmittedAnswer] = useState<{
    marks: number
    feedback: string
  } | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [tutorOpen, setTutorOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const questionTextRef = useRef<HTMLDivElement>(null)
  const [questionHighlights, setQuestionHighlights] = useState<string[]>([])

  const filteredQuestions =
    selectedDifficulty === "all" ? questions : questions.filter((q) => q.difficulty === selectedDifficulty)

  const currentQuestion = filteredQuestions[currentQuestionIndex]
  const supabase = createClient()

  useEffect(() => {
    // Load previous answer if exists
    const prevAnswer = previousAnswers.find((a) => a.question_id === currentQuestion?.id)
    if (prevAnswer) {
      setAnswer(prevAnswer.answer_text || "")
      setQuestionHighlights(prevAnswer.highlighted_text || [])
    } else {
      setAnswer("")
      setQuestionHighlights([])
    }
    setSubmittedAnswer(null)
    setSelectedOption(null)
  }, [currentQuestionIndex, currentQuestion, previousAnswers])

  const handleHighlightQuestion = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString()
      setQuestionHighlights((prev) => [...prev, selectedText])
      selection.removeAllRanges()
    }
  }

  const removeHighlight = (index: number) => {
    setQuestionHighlights((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!currentQuestion) return
    setIsSubmitting(true)

    try {
      let answerText = answer
      let correctAnswer = currentQuestion.correct_answer

      if (currentQuestion.question_type === "multiple_choice" && selectedOption !== null) {
        const selectedOpt = currentQuestion.question_options?.find((o) => o.id === selectedOption)
        answerText = selectedOpt?.option_text || ""
        correctAnswer = currentQuestion.question_options?.find((o) => o.is_correct)?.option_text || ""
      }

      // Call AI to mark the answer using Edexcel mark scheme
      const response = await fetch("/api/mark-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question_text,
          answer: answerText,
          markScheme: currentQuestion.mark_scheme,
          maxMarks: currentQuestion.marks,
          questionType: currentQuestion.question_type,
          correctAnswer: correctAnswer,
        }),
      })

      const result = await response.json()

      // Save answer to database
      await supabase.from("user_answers").insert({
        user_id: userId,
        question_id: currentQuestion.id,
        answer_text: answerText,
        highlighted_text: questionHighlights,
        marks_awarded: result.marks,
        ai_feedback: result.feedback,
      })

      // Update progress
      const percentage = Math.round((result.marks / currentQuestion.marks) * 100)
      await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          topic_id: topic.id,
          completion_percentage: percentage,
          mastery_level: percentage >= 80 ? "mastered" : percentage >= 50 ? "practiced" : "learning",
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "user_id,topic_id",
        },
      )

      // Track weak topics if score is low
      if (percentage < 50) {
        await supabase.from("user_weak_topics").upsert(
          {
            user_id: userId,
            topic_id: topic.id,
            weakness_score: 100 - percentage,
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: "user_id,topic_id",
          },
        )
      }

      setSubmittedAnswer({
        marks: result.marks,
        feedback: result.feedback,
      })
    } catch (error) {
      console.error("[v0] Error submitting answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>No questions available for this difficulty level.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className={`flex-1 transition-all ${tutorOpen ? "mr-96" : ""}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/learn/${subjectCode}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Curriculum
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setTutorOpen(!tutorOpen)}>
                <BookOpen className="mr-2 h-4 w-4" />
                AI Tutor
              </Button>
            </div>
          </div>
        </header>

        {/* Main Practice Area */}
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Topic Info */}
            <div>
              <h1 className="text-2xl font-bold">
                {topic.topic_code} - {topic.title}
              </h1>
              <p className="text-muted-foreground">{topic.themes.title}</p>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Difficulty:</span>
              <div className="flex gap-2">
                {["all", "easy", "medium", "hard"].map((diff) => (
                  <Button
                    key={diff}
                    size="sm"
                    variant={selectedDifficulty === diff ? "default" : "outline"}
                    onClick={() => {
                      setSelectedDifficulty(diff)
                      setCurrentQuestionIndex(0)
                    }}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Side - Question and Answer */}
              <div className="space-y-6">
                {/* Question Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                          <Badge
                            variant={
                              currentQuestion.difficulty === "easy"
                                ? "secondary"
                                : currentQuestion.difficulty === "medium"
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {currentQuestion.difficulty}
                          </Badge>
                          <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleHighlightQuestion}
                        title="Select text and click to highlight"
                      >
                        <Highlighter className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      ref={questionTextRef}
                      className="prose prose-sm max-w-none select-text rounded-lg bg-muted/50 p-4"
                    >
                      {currentQuestion.question_text}
                    </div>

                    {questionHighlights.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Your highlights:</p>
                        <div className="flex flex-wrap gap-2">
                          {questionHighlights.map((highlight, index) => (
                            <Badge key={index} variant="secondary" className="gap-2">
                              {highlight.substring(0, 50)}
                              {highlight.length > 50 && "..."}
                              <button onClick={() => removeHighlight(index)}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice Options */}
                    {currentQuestion.question_type === "multiple_choice" && currentQuestion.question_options && (
                      <div className="space-y-2">
                        {currentQuestion.question_options.map((option) => (
                          <button
                            key={option.id}
                            className={`w-full rounded-lg border p-4 text-left transition-all ${
                              selectedOption === option.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-muted"
                            } ${
                              submittedAnswer
                                ? option.is_correct
                                  ? "border-green-600 bg-green-50"
                                  : selectedOption === option.id
                                    ? "border-red-600 bg-red-50"
                                    : ""
                                : ""
                            }`}
                            onClick={() => !submittedAnswer && setSelectedOption(option.id)}
                            disabled={!!submittedAnswer}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  selectedOption === option.id ? "border-primary bg-primary" : "border-border"
                                }`}
                              >
                                {selectedOption === option.id && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                              <span>{option.option_text}</span>
                              {submittedAnswer && option.is_correct && (
                                <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Answer Area */}
                {currentQuestion.question_type !== "multiple_choice" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            disabled={!!submittedAnswer}
                            className="min-h-[300px] w-full resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(transparent, transparent 27px, #e5e7eb 27px, #e5e7eb 28px)",
                              lineHeight: "28px",
                              paddingTop: "4px",
                            }}
                          />
                        </div>

                        {!submittedAnswer ? (
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!answer.trim() && !selectedOption)}
                            className="w-full"
                          >
                            {isSubmitting ? "Submitting..." : "Submit Answer"}
                            <Send className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Card className="border-primary">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Marks: {submittedAnswer.marks} / {currentQuestion.marks}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{submittedAnswer.feedback}</p>
                              <div className="mt-4 flex gap-2">
                                <Button
                                  onClick={nextQuestion}
                                  disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                                >
                                  Next Question
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentQuestion.question_type === "multiple_choice" && !submittedAnswer && (
                  <Button onClick={handleSubmit} disabled={isSubmitting || selectedOption === null} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {currentQuestion.question_type === "multiple_choice" && submittedAnswer && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {submittedAnswer.marks === currentQuestion.marks ? "Correct!" : "Incorrect"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{submittedAnswer.feedback}</p>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={nextQuestion} disabled={currentQuestionIndex >= filteredQuestions.length - 1}>
                          Next Question
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestionIndex + 1} of {filteredQuestions.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Side - Textbook Content */}
              <Card className="sticky top-20 h-fit max-h-[calc(100vh-6rem)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Textbook - {topic.topic_code}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* AI Tutor Sidebar */}
      {tutorOpen && <AiTutorSidebar userId={userId} topicId={topic.id} onClose={() => setTutorOpen(false)} />}
    </div>
  )
}
