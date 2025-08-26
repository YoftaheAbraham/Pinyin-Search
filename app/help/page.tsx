import { BookOpen, Search, Settings, Users, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function Help() {
  const faqs = [
    {
      question: "How do I search for pinyin?",
      answer:
        "Simply type Chinese characters or English words in the search bar. The AI will automatically generate accurate pinyin pronunciations.",
    },
    {
      question: "Can I contribute to the dictionary?",
      answer:
        "Yes! You can help proofread entries through our community proofreading system. Click on 'Proofread' in the menu to get started.",
    },
    {
      question: "How accurate are the AI translations?",
      answer:
        "Our AI provides highly accurate translations, and all entries are verified by our community to ensure quality and correctness.",
    },
    {
      question: "How do I request admin access?",
      answer:
        "Admin access is available for educators and language professionals. Contact us through the admin request page for more information.",
    },
    {
      question: "Is the dictionary free to use?",
      answer:
        "Yes, our pinyin dictionary is completely free for all users. We believe in making language learning accessible to everyone.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of our AI-powered pinyin dictionary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 border border-border rounded-lg">
            <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Search Tips</h3>
            <p className="text-sm text-muted-foreground">
              Learn how to search effectively and get the best results from our dictionary.
            </p>
          </div>
          <div className="text-center p-6 border border-border rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Community</h3>
            <p className="text-sm text-muted-foreground">
              Join our community of learners and help improve the dictionary quality.
            </p>
          </div>
          <div className="text-center p-6 border border-border rounded-lg">
            <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Admin Access</h3>
            <p className="text-sm text-muted-foreground">
              Information for educators and professionals seeking admin privileges.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {faq.question}
              </h3>
              <p className="text-muted-foreground pl-7">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still need help?</p>
          <Link href="/">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Back to Dictionary
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}