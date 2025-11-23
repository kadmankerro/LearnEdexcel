import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnEdexcel</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {
                "Free AI-powered learning platform for A-Level Edexcel students. Master Economics, Politics, and Business with personalized tutoring and unlimited practice."
              }
            </p>
            <p className="text-xs text-muted-foreground">{"© 2025 LearnEdexcel. Built for students, by students."}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Subjects</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Economics
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Politics
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Business
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Practice Questions
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Past Papers
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Study Guides
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  AI Tutor
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>{"This is an independent educational platform and is not affiliated with Pearson Edexcel."}</p>
        </div>
      </div>
    </footer>
  )
}
