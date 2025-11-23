import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubjectSelector } from "@/components/learn/subject-selector"

export default async function LearnPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch subjects
  const { data: subjects } = await supabase.from("subjects").select("*").order("name")

  return (
    <div className="min-h-screen bg-background">
      <SubjectSelector subjects={subjects || []} userId={user.id} />
    </div>
  )
}
