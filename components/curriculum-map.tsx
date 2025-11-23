"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Lock } from "lucide-react"
import { useState } from "react"

const curriculumData = {
  economics: [
    { id: 1, title: "Introduction to Markets", status: "completed", progress: 100 },
    { id: 2, title: "Supply and Demand", status: "in-progress", progress: 65 },
    { id: 3, title: "Price Elasticity", status: "in-progress", progress: 40 },
    { id: 4, title: "Market Failures", status: "available", progress: 0 },
    { id: 5, title: "Government Intervention", status: "available", progress: 0 },
    { id: 6, title: "Macroeconomic Objectives", status: "locked", progress: 0 },
  ],
  politics: [
    { id: 1, title: "UK Political System", status: "completed", progress: 100 },
    { id: 2, title: "Democracy & Participation", status: "completed", progress: 100 },
    { id: 3, title: "Political Parties", status: "in-progress", progress: 50 },
    { id: 4, title: "Voting Behaviour", status: "available", progress: 0 },
    { id: 5, title: "The Constitution", status: "available", progress: 0 },
    { id: 6, title: "Parliament", status: "locked", progress: 0 },
  ],
  business: [
    { id: 1, title: "Business Objectives", status: "completed", progress: 100 },
    { id: 2, title: "Market Research", status: "in-progress", progress: 75 },
    { id: 3, title: "Marketing Mix", status: "in-progress", progress: 30 },
    { id: 4, title: "Financial Planning", status: "available", progress: 0 },
    { id: 5, title: "Human Resources", status: "available", progress: 0 },
    { id: 6, title: "Operations Management", status: "locked", progress: 0 },
  ],
}

export function CurriculumMap() {
  const [activeSubject, setActiveSubject] = useState<"economics" | "politics" | "business">("economics")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-secondary" />
      case "in-progress":
        return <Circle className="h-5 w-5 text-primary" />
      case "available":
        return <Circle className="h-5 w-5 text-muted-foreground" />
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Circle className="h-5 w-5" />
    }
  }

  return (
    <section id="curriculum" className="border-b border-border bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">Your Learning Journey</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            {"Explore the complete curriculum and track your progress across every topic"}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <Button
            variant={activeSubject === "economics" ? "default" : "outline"}
            onClick={() => setActiveSubject("economics")}
          >
            Economics
          </Button>
          <Button
            variant={activeSubject === "politics" ? "default" : "outline"}
            onClick={() => setActiveSubject("politics")}
          >
            Politics
          </Button>
          <Button
            variant={activeSubject === "business" ? "default" : "outline"}
            onClick={() => setActiveSubject("business")}
          >
            Business
          </Button>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {curriculumData[activeSubject].map((topic, index) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex-shrink-0">{getStatusIcon(topic.status)}</div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-card-foreground">{topic.title}</h4>
                        <span className="text-sm text-muted-foreground">{topic.progress}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${topic.progress}%` }}
                        />
                      </div>
                    </div>

                    {index < curriculumData[activeSubject].length - 1 && (
                      <div
                        className="absolute left-[27px] top-full h-4 w-0.5 bg-border"
                        style={{ marginTop: "1rem" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
