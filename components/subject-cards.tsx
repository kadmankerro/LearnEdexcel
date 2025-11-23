import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Briefcase } from "lucide-react"

const subjects = [
  {
    title: "Economics",
    icon: TrendingUp,
    description: "Master microeconomics, macroeconomics, and international trade with comprehensive topic coverage.",
    topics: ["Market Structures", "Fiscal Policy", "Supply & Demand", "International Economics"],
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Politics",
    icon: Users,
    description: "Understand political systems, ideologies, and comparative politics for UK and global contexts.",
    topics: ["UK Politics", "Political Ideologies", "Comparative Politics", "Global Governance"],
    color: "bg-secondary text-secondary-foreground",
  },
  {
    title: "Business",
    icon: Briefcase,
    description: "Excel in business management, marketing, finance, and strategy with real-world applications.",
    topics: ["Marketing", "Finance", "Operations", "Strategic Management"],
    color: "bg-accent text-accent-foreground",
  },
]

export function SubjectCards() {
  return (
    <section id="subjects" className="border-b border-border bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Three Subjects, Endless Possibilities
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            {"Comprehensive coverage of the entire Edexcel A-Level curriculum"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.title} className="group transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${subject.color}`}>
                  <subject.icon className="h-6 w-6" />
                </div>

                <h3 className="mb-2 text-2xl font-bold text-card-foreground">{subject.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{subject.description}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {subject.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
