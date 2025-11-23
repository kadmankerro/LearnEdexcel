import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-20 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">100% Free Forever</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Master A-Level Edexcel with AI-Powered Learning
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
            {
              "Excel in Economics, Politics, and Business with personalized AI tutoring, interactive curriculum maps, and unlimited practice questions. Built for Edexcel students, powered by advanced AI."
            }
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto">
              Start Learning Free
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Explore Subjects
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <TrendingUp className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span>{"Track Your Progress"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
              </div>
              <span>{"AI-Powered Feedback"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-xs font-bold text-primary-foreground">∞</span>
              </div>
              <span>{"Unlimited Practice"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
