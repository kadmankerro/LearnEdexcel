"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { redirect, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, TrendingUp, Clock, Award } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  display_name: string
  email: string
  current_grade: string | null
  target_grade: string | null
  skill_level: string | null
  onboarded: boolean
  subjects_selected: string[]
}

interface Subject {
  id: number
  name: string
  code: string
  description: string
}

interface TopicProgress {
  topic_id: number
  topic_code: string
  topic_title: string
  mastery_level: string
  completion_percentage: number
  questions_answered: number
}

interface ActiveRecallItem {
  id: number
  question_id: number
  topic_title: string
  topic_code: string
  next_review_date: string
  confidence_level: number
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([])
  const [activeRecall, setActiveRecall] = useState<ActiveRecallItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        redirect("/auth/login")
      }

      // Load profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)

        // If not onboarded, redirect to onboarding
        if (!profileData.onboarded) {
          router.push("/onboarding")
          return
        }
      }

      // Load subjects
      const { data: subjectsData } = await supabase.from("subjects").select("*").order("name")

      if (subjectsData) {
        setSubjects(subjectsData)
      }

      // Load user progress with topic details
      const { data: progressData } = await supabase
        .from("user_progress")
        .select(`
          topic_id,
          mastery_level,
          completion_percentage,
          topics (
            id,
            topic_code,
            title
          )
        `)
        .eq("user_id", user.id)
        .order("last_accessed", { ascending: false })
        .limit(10)

      if (progressData) {
        const formattedProgress = progressData.map((p: any) => ({
          topic_id: p.topic_id,
          topic_code: p.topics.topic_code,
          topic_title: p.topics.title,
          mastery_level: p.mastery_level,
          completion_percentage: p.completion_percentage,
          questions_answered: 0, // Will be calculated from user_answers
        }))
        setTopicProgress(formattedProgress)
      }

      // Load active recall items due for review
      const { data: recallData } = await supabase
        .from("active_recall_queue")
        .select(`
          id,
          question_id,
          next_review_date,
          confidence_level,
          topics (
            title,
            topic_code
          )
        `)
        .eq("user_id", user.id)
        .lte("next_review_date", new Date().toISOString())
        .order("next_review_date")
        .limit(5)

      if (recallData) {
        const formattedRecall = recallData.map((r: any) => ({
          id: r.id,
          question_id: r.question_id,
          topic_title: r.topics.title,
          topic_code: r.topics.topic_code,
          next_review_date: r.next_review_date,
          confidence_level: r.confidence_level,
        }))
        setActiveRecall(formattedRecall)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router, supabase])

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "mastered":
        return "text-green-600"
      case "practiced":
        return "text-yellow-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {profile.display_name || "Student"}!</h1>
          <p className="text-muted-foreground">
            Current Grade: <Badge variant="outline">{profile.current_grade || "Not set"}</Badge>
            {" • "}Target Grade: <Badge variant="default">{profile.target_grade || "Not set"}</Badge>
          </p>
        </div>

        {/* Active Recall Section */}
        {activeRecall.length > 0 && (
          <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Active Recall - Questions Due for Review
              </CardTitle>
              <CardDescription>
                Strengthen your memory by reviewing these questions from topics you've studied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeRecall.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
                    <div>
                      <p className="font-medium">
                        {item.topic_code} - {item.topic_title}
                      </p>
                      <p className="text-sm text-muted-foreground">Confidence: {item.confidence_level}%</p>
                    </div>
                    <Button size="sm">Review Now</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics Studied</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topicProgress.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topicProgress.filter((t) => t.mastery_level === "mastered").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review Queue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRecall.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skill Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile.skill_level || "Beginner"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Subjects</CardTitle>
            <CardDescription>Select a subject to start practicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {subjects.map((subject) => (
                <Link key={subject.id} href={`/learn/${subject.code}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Progress</CardTitle>
            <CardDescription>Your most recently studied topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicProgress.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No progress yet. Start practicing to see your progress here!
                </p>
              ) : (
                topicProgress.map((topic) => (
                  <div key={topic.topic_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {topic.topic_code} - {topic.topic_title}
                        </p>
                        <p className={`text-sm ${getMasteryColor(topic.mastery_level)}`}>
                          {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
                        </p>
                      </div>
                      <Badge variant="outline">{topic.completion_percentage}%</Badge>
                    </div>
                    <Progress value={topic.completion_percentage} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
