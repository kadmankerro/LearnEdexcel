"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  BookOpen,
  Highlighter,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
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
  const [isHighlightMode, setIsHighlightMode] = useState(false)

  const filteredQuestions =
    selectedDifficulty === "all" ? questions : questions.filter((q) => q.difficulty === selectedDifficulty)

  const currentQuestion = filteredQuestions[currentQuestionIndex]
  const supabase = createClient()

  useEffect(() => {
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
    setIsHighlightMode(false)
  }, [currentQuestionIndex, currentQuestion, previousAnswers])

  const handleHighlightQuestion = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      if (!questionHighlights.includes(selectedText)) {
        setQuestionHighlights((prev) => [...prev, selectedText])
      }
      selection.removeAllRanges()
      setIsHighlightMode(false)
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

      await supabase.from("user_answers").insert({
        user_id: userId,
        question_id: currentQuestion.id,
        answer_text: answerText,
        highlighted_text: questionHighlights,
        marks_awarded: result.marks,
        ai_feedback: result.feedback,
      })

      await fetch("/api/active-recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          topicId: topic.id,
          marksAwarded: result.marks,
          maxMarks: currentQuestion.marks,
        }),
      })

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

  const getPerformanceIcon = () => {
    if (!submittedAnswer) return null
    const percentage = (submittedAnswer.marks / currentQuestion.marks) * 100
    if (percentage >= 80) return <CheckCircle className="h-6 w-6 text-green-600" />
    if (percentage >= 50) return <AlertCircle className="h-6 w-6 text-yellow-600" />
    return <XCircle className="h-6 w-6 text-red-600" />
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">There are no questions available for this difficulty level.</p>
            <Button onClick={() => setSelectedDifficulty("all")}>Show All Questions</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className={`flex-1 transition-all ${tutorOpen ? "mr-96" : ""}`}>
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                Question {currentQuestionIndex + 1} / {filteredQuestions.length}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setTutorOpen(!tutorOpen)}>
                <BookOpen className="mr-2 h-4 w-4" />
                AI Tutor
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple/5">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h1 className="text-xl font-bold">
                    {topic.topic_code} - {topic.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {topic.themes.title} • {topic.themes.subjects.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {["easy", "medium", "hard"].map((diff) => (
                    <Button
                      key={diff}
                      size="sm"
                      variant={selectedDifficulty === diff ? "default" : "outline"}
                      onClick={() => {
                        setSelectedDifficulty(diff)
                        setCurrentQuestionIndex(0)
                      }}
                      className="capitalize"
                    >
                      {diff}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={selectedDifficulty === "all" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedDifficulty("all")
                      setCurrentQuestionIndex(0)
                    }}
                  >
                    All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                          <Badge
                            variant={
                              currentQuestion.difficulty === "easy"
                                ? "secondary"
                                : currentQuestion.difficulty === "medium"
                                  ? "default"
                                  : "destructive"
                            }
                            className="capitalize"
                          >
                            {currentQuestion.difficulty}
                          </Badge>
                          <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                          <Badge variant="outline" className="capitalize">
                            {currentQuestion.question_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isHighlightMode ? "default" : "ghost"}
                        onClick={() => {
                          setIsHighlightMode(!isHighlightMode)
                          if (!isHighlightMode) {
                            handleHighlightQuestion()
                          }
                        }}
                        title={isHighlightMode ? "Click after selecting text" : "Select text to highlight"}
                      >
                        <Highlighter className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div
                      ref={questionTextRef}
                      className="prose prose-sm max-w-none select-text rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 p-6 leading-relaxed"
                      style={{ fontSize: "15px", lineHeight: "1.8" }}
                    >
                      {currentQuestion.question_text}
                    </div>

                    {questionHighlights.length > 0 && (
                      <div className="space-y-2 rounded-lg border bg-yellow-50 p-4">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Highlighter className="h-4 w-4" />
                          Your Highlights:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {questionHighlights.map((highlight, index) => (
                            <Badge key={index} variant="secondary" className="gap-2 bg-yellow-200 hover:bg-yellow-300">
                              <span className="max-w-[200px] truncate">{highlight}</span>
                              <button onClick={() => removeHighlight(index)} className="hover:text-destructive">
                                <XCircle className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentQuestion.question_type === "multiple_choice" && currentQuestion.question_options && (
                      <div className="space-y-3">
                        {currentQuestion.question_options.map((option) => (
                          <button
                            key={option.id}
                            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                              selectedOption === option.id
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-border hover:bg-muted hover:border-muted-foreground"
                            } ${
                              submittedAnswer
                                ? option.is_correct
                                  ? "border-green-600 bg-green-50"
                                  : selectedOption === option.id
                                    ? "border-red-600 bg-red-50"
                                    : "opacity-50"
                                : ""
                            }`}
                            onClick={() => !submittedAnswer && setSelectedOption(option.id)}
                            disabled={!!submittedAnswer}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                  selectedOption === option.id ? "border-primary bg-primary" : "border-border"
                                }`}
                              >
                                {selectedOption === option.id && <div className="h-3 w-3 rounded-full bg-white" />}
                              </div>
                              <span className="flex-1">{option.option_text}</span>
                              {submittedAnswer && option.is_correct && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {currentQuestion.question_type !== "multiple_choice" && (
                  <Card className="border-2">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg">Your Answer</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here... Write clearly and structure your answer according to the mark scheme."
                            disabled={!!submittedAnswer}
                            className="min-h-[350px] w-full resize-none rounded-lg border-2 border-border bg-white p-6 font-sans text-sm leading-relaxed shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)",
                              lineHeight: "32px",
                              paddingTop: "8px",
                            }}
                          />
                        </div>

                        {!submittedAnswer ? (
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!answer.trim() && !selectedOption)}
                            className="w-full h-12 text-base"
                            size="lg"
                          >
                            {isSubmitting ? "Marking Answer..." : "Submit Answer"}
                            <Send className="ml-2 h-5 w-5" />
                          </Button>
                        ) : (
                          <Card className="border-2 border-primary shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-purple/10">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-xl flex items-center gap-3">
                                  {getPerformanceIcon()}
                                  Score: {submittedAnswer.marks} / {currentQuestion.marks}
                                </CardTitle>
                                <Badge
                                  variant={
                                    submittedAnswer.marks / currentQuestion.marks >= 0.8
                                      ? "default"
                                      : submittedAnswer.marks / currentQuestion.marks >= 0.5
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-base px-3 py-1"
                                >
                                  {Math.round((submittedAnswer.marks / currentQuestion.marks) * 100)}%
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                              <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm font-medium mb-2">Feedback:</p>
                                <p className="text-sm leading-relaxed">{submittedAnswer.feedback}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setCurrentQuestionIndex((prev) => prev + 1)
                                  }}
                                  disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                                  className="flex-1"
                                  size="lg"
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
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedOption === null}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isSubmitting ? "Marking Answer..." : "Submit Answer"}
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                )}

                {currentQuestion.question_type === "multiple_choice" && submittedAnswer && (
                  <Card className="border-2 border-primary shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-purple/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-3">
                          {getPerformanceIcon()}
                          {submittedAnswer.marks === currentQuestion.marks ? "Correct!" : "Incorrect"}
                        </CardTitle>
                        <Badge
                          variant={submittedAnswer.marks === currentQuestion.marks ? "default" : "destructive"}
                          className="text-base px-3 py-1"
                        >
                          {submittedAnswer.marks} / {currentQuestion.marks}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm leading-relaxed">{submittedAnswer.feedback}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentQuestionIndex((prev) => prev + 1)
                        }}
                        disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                        className="w-full"
                        size="lg"
                      >
                        Next Question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                      size="lg"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      disabled={currentQuestionIndex >= filteredQuestions.length - 1}
                      className="w-full"
                      size="lg"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="sticky top-20 h-fit max-h-[calc(100vh-6rem)] border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Textbook - {topic.topic_code}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{topic.content}</p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {tutorOpen && <AiTutorSidebar userId={userId} topicId={topic.id} onClose={() => setTutorOpen(false)} />}
    </div>
  )
}
