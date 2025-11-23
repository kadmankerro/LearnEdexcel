import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { SubjectCards } from "@/components/subject-cards"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <SubjectCards />
      <Features />
      <Footer />
    </div>
  )
}
