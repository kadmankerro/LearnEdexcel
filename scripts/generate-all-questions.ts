// This Node.js script generates 100+ questions for each topic in the database
// Run this from the scripts folder to populate the database

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface Topic {
  id: number
  title: string
  topic_code: string
}

async function generateQuestionsForTopic(topicId: number, topicTitle: string) {
  console.log(`\n📝 Generating questions for: ${topicTitle} (ID: ${topicId})`)

  const questionTypes = [
    { type: "multiple_choice", count: 40 },
    { type: "short_answer", count: 30 },
    { type: "essay", count: 20 },
    { type: "calculation", count: 10 },
  ]

  for (const { type, count } of questionTypes) {
    try {
      console.log(`  - Generating ${count} ${type} questions...`)

      // Generate in batches of 10 to avoid timeouts
      const batchSize = 10
      const batches = Math.ceil(count / batchSize)

      for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(batchSize, count - i * batchSize)

        const response = await fetch(`${API_BASE}/api/generate-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicId,
            count: batchCount,
            forceType: type,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error(`    ❌ Error: ${error.error}`)
          continue
        }

        const result = await response.json()
        console.log(`    ✅ Batch ${i + 1}/${batches}: ${result.insertedCount} questions added`)

        // Wait a bit between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`    ❌ Error generating ${type} questions:`, error)
    }
  }
}

async function main() {
  console.log("🚀 Starting question generation for all topics...")
  console.log("⏰ This will take a while (est. 30-60 minutes for all topics)\n")

  try {
    // Fetch all topics from Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=id,title,topic_code`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch topics from Supabase")
    }

    const topics: Topic[] = await response.json()
    console.log(`📚 Found ${topics.length} topics to process\n`)

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      console.log(`\n[${i + 1}/${topics.length}] Processing: ${topic.topic_code} - ${topic.title}`)
      await generateQuestionsForTopic(topic.id, topic.title)

      // Brief pause between topics
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    console.log("\n\n✅ Question generation complete!")
    console.log("📊 Run a count query on your database to verify")
  } catch (error) {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  }
}

// Run the script
main()
