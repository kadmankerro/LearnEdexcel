import { Card, CardContent } from "@/components/ui/card"
import { Map, Brain, Target, BarChart3, FileText, Zap } from "lucide-react"

const features = [
  {
    icon: Map,
    title: "Interactive Curriculum Atlas",
    description: "Visualize your entire curriculum as an interactive map that evolves with your progress",
  },
  {
    icon: Brain,
    title: "AI Tutor 24/7",
    description: "Get instant explanations, step-by-step solutions, and personalized guidance anytime",
  },
  {
    icon: Target,
    title: "Adaptive Practice",
    description: "Questions automatically adjust to your skill level for optimal learning",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your mastery across all topics with detailed performance insights",
  },
  {
    icon: FileText,
    title: "Past Papers & Marking",
    description: "Access real exam papers with instant AI marking and detailed feedback",
  },
  {
    icon: Zap,
    title: "Instant Question Help",
    description: "Snap a photo of any question to get detailed explanations in seconds",
  },
]

export function Features() {
  return (
    <section id="features" className="border-b border-border bg-background py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need to Excel
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            {"Powerful features designed specifically for A-Level success"}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
