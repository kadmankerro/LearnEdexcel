"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft } from "lucide-react"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [currentGrade, setCurrentGrade] = useState("")
  const [targetGrade, setTargetGrade] = useState("")
  const [subjects, setSubjects] = useState<string[]>([])
  const [skillLevel, setSkillLevel] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const grades = ["U", "E", "D", "C", "B", "A", "A*"]
  const availableSubjects = [
    { code: "eco", name: "Economics" },
    { code: "bus", name: "Business" },
    { code: "pol", name: "Politics" },
  ]

  useEffect(() => {
    // Check if user is already onboarded
    async function checkOnboarding() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single()

      if (profile?.onboarded) {
        router.push("/dashboard")
      }
    }

    checkOnboarding()
  }, [router, supabase])

  const handleSubjectToggle = (code: string) => {
    setSubjects((prev) => (prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]))
  }

  const calculateSkillLevel = () => {
    // Auto-calculate skill level based on current grade
    const gradeIndex = grades.indexOf(currentGrade)
    if (gradeIndex <= 2) return "beginner"
    if (gradeIndex <= 4) return "intermediate"
    return "advanced"
  }

  const handleComplete = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const calculatedSkillLevel = calculateSkillLevel()

    await supabase
      .from("profiles")
      .update({
        current_grade: currentGrade,
        target_grade: targetGrade,
        skill_level: calculatedSkillLevel,
        subjects_selected: subjects,
        onboarded: true,
      })
      .eq("id", user.id)

    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to LearnEdexcel!</CardTitle>
          <CardDescription>Let's personalize your learning experience - Step {step} of 3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">What's your current predicted grade?</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  This helps us understand your starting point and recommend appropriate questions
                </p>
                <RadioGroup value={currentGrade} onValueChange={setCurrentGrade}>
                  <div className="grid grid-cols-4 gap-3">
                    {grades.map((grade) => (
                      <div key={grade} className="flex items-center">
                        <RadioGroupItem value={grade} id={`current-${grade}`} className="peer sr-only" />
                        <Label
                          htmlFor={`current-${grade}`}
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary"
                        >
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold">What's your target grade?</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll help you work towards this goal with personalized practice
                </p>
                <RadioGroup value={targetGrade} onValueChange={setTargetGrade}>
                  <div className="grid grid-cols-4 gap-3">
                    {grades.map((grade) => (
                      <div key={grade} className="flex items-center">
                        <RadioGroupItem value={grade} id={`target-${grade}`} className="peer sr-only" />
                        <Label
                          htmlFor={`target-${grade}`}
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary"
                        >
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={() => setStep(2)} disabled={!currentGrade || !targetGrade} className="w-full">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Which subjects are you studying?</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select all that apply - you can always change this later
                </p>
                <div className="space-y-3">
                  {availableSubjects.map((subject) => (
                    <div
                      key={subject.code}
                      className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        subjects.includes(subject.code)
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:bg-accent"
                      }`}
                      onClick={() => handleSubjectToggle(subject.code)}
                    >
                      <Checkbox
                        id={subject.code}
                        checked={subjects.includes(subject.code)}
                        onCheckedChange={() => handleSubjectToggle(subject.code)}
                      />
                      <Label htmlFor={subject.code} className="flex-1 cursor-pointer text-base">
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={subjects.length === 0} className="flex-1">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Summary</Label>
                <div className="mt-4 space-y-3 rounded-lg border p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Grade:</span>
                    <span className="font-medium">{currentGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Grade:</span>
                    <span className="font-medium">{targetGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subjects:</span>
                    <span className="font-medium">
                      {availableSubjects
                        .filter((s) => subjects.includes(s.code))
                        .map((s) => s.name)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skill Level:</span>
                    <span className="font-medium capitalize">{calculateSkillLevel()}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Based on your responses, we'll recommend questions at the right difficulty level and track your
                  progress towards your target grade. We'll also use active recall to help you remember what you've
                  learned!
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading} className="flex-1">
                  {loading ? "Setting up..." : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
