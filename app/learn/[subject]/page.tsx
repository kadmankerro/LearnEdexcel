import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CurriculumView } from "@/components/learn/curriculum-view"

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch subject data
  const { data: subjectData } = await supabase.from("subjects").select("*").eq("code", subject.toUpperCase()).single()

  if (!subjectData) {
    redirect("/learn")
  }

  // Fetch themes with topics
  const { data: themes } = await supabase
    .from("themes")
    .select(`
      *,
      topics:topics(*)
    `)
    .eq("subject_id", subjectData.id)
    .order("theme_number")

  // Fetch user progress
  const { data: progress } = await supabase.from("user_progress").select("*").eq("user_id", user.id)

  return <CurriculumView subject={subjectData} themes={themes || []} userProgress={progress || []} userId={user.id} />
}
