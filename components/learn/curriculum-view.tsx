"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, ChevronRight, CheckCircle2, Circle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Topic {
  id: number
  topic_code: string
  title: string
  content: string
}

interface Theme {
  id: number
  theme_number: number
  title: string
  description: string
  topics: Topic[]
}

interface Subject {
  id: number
  name: string
  code: string
  description: string
}

interface UserProgress {
  topic_id: number
  completion_percentage: number
  mastery_level: string
}

export function CurriculumView({
  subject,
  themes,
  userProgress,
  userId,
}: {
  subject: Subject
  themes: Theme[]
  userProgress: UserProgress[]
  userId: string
}) {
  const router = useRouter()
  const [expandedTheme, setExpandedTheme] = useState<number | null>(themes[0]?.id || null)

  const getTopicProgress = (topicId: number) => {
    return userProgress.find((p) => p.topic_id === topicId)
  }

  const getThemeProgress = (theme: Theme) => {
    if (theme.topics.length === 0) return 0
    const totalProgress = theme.topics.reduce((sum, topic) => {
      const progress = getTopicProgress(topic.id)
      return sum + (progress?.completion_percentage || 0)
    }, 0)
    return Math.round(totalProgress / theme.topics.length)
  }

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "mastered":
        return "text-green-600"
      case "practiced":
        return "text-blue-600"
      case "learning":
        return "text-yellow-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/learn">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">{subject.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">{subject.name} Curriculum</h1>
            <p className="mt-2 text-muted-foreground">
              Select a topic to start practicing questions and reading the textbook
            </p>
          </div>

          {/* Themes and Topics */}
          <div className="space-y-6">
            {themes.map((theme) => {
              const themeProgress = getThemeProgress(theme)
              const isExpanded = expandedTheme === theme.id

              return (
                <Card key={theme.id}>
                  <CardHeader className="cursor-pointer" onClick={() => setExpandedTheme(isExpanded ? null : theme.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {theme.theme_number}
                          </span>
                          {theme.title}
                        </CardTitle>
                        <CardDescription className="mt-2">{theme.description}</CardDescription>
                      </div>
                      <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{themeProgress}%</span>
                      </div>
                      <Progress value={themeProgress} className="h-2" />
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {theme.topics.map((topic) => {
                          const progress = getTopicProgress(topic.id)
                          const masteryLevel = progress?.mastery_level || "not_started"
                          const completionPercentage = progress?.completion_percentage || 0

                          return (
                            <div
                              key={topic.id}
                              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-accent hover:shadow-md"
                              onClick={() => router.push(`/learn/${subject.code.toLowerCase()}/practice/${topic.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                {completionPercentage >= 80 ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className={`h-5 w-5 ${getMasteryColor(masteryLevel)}`} />
                                )}
                                <div>
                                  <p className="font-medium">
                                    {topic.topic_code} - {topic.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {masteryLevel === "not_started" && "Not started"}
                                    {masteryLevel === "learning" && "Learning"}
                                    {masteryLevel === "practiced" && "Practiced"}
                                    {masteryLevel === "mastered" && "Mastered"}
                                    {completionPercentage > 0 && ` • ${completionPercentage}% complete`}
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                Practice
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
