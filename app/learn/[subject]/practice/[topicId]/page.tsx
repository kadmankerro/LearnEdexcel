import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PracticeInterface } from "@/components/learn/practice-interface"

export default async function PracticePage({
  params,
}: {
  params: Promise<{ subject: string; topicId: string }>
}) {
  const { subject, topicId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch topic data
  const { data: topic } = await supabase
    .from("topics")
    .select(`
      *,
      themes:theme_id(
        *,
        subjects:subject_id(*)
      )
    `)
    .eq("id", topicId)
    .single()

  if (!topic) {
    redirect("/learn")
  }

  // Fetch questions for this topic
  const { data: questions } = await supabase
    .from("questions")
    .select(`
      *,
      question_options:question_options(*)
    `)
    .eq("topic_id", topicId)
    .order("difficulty")
    .order("id")

  // Fetch user's previous answers
  const { data: previousAnswers } = await supabase
    .from("user_answers")
    .select("*")
    .eq("user_id", user.id)
    .in("question_id", questions?.map((q) => q.id) || [])

  return (
    <PracticeInterface
      topic={topic}
      questions={questions || []}
      previousAnswers={previousAnswers || []}
      userId={user.id}
      subjectCode={subject}
    />
  )
}
