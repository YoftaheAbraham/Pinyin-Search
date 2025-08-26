import { BookOpen, Sparkles, Users, Target } from "lucide-react"
import Link from "next/link"

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Pinyin Dictionary</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your AI-powered companion for learning Chinese pronunciation and improving language skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">AI-Powered Translations</h3>
                <p className="text-muted-foreground">
                  Advanced artificial intelligence ensures accurate pinyin pronunciations for both Chinese characters
                  and English words.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Community Driven</h3>
                <p className="text-muted-foreground">
                  Our community of language learners and native speakers help verify and improve translation accuracy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Learning Focused</h3>
                <p className="text-muted-foreground">
                  Designed specifically for students, teachers, and anyone learning Chinese pronunciation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <p className="text-sm">Enter Chinese characters or English words</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <p className="text-sm">AI processes and generates accurate pinyin</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <p className="text-sm">Community verifies and improves results</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <p className="text-sm">Learn correct pronunciation instantly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
              <BookOpen className="h-5 w-5" />
              Start Learning
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}