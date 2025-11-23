import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { message, userId, topicId, weakTopics } = await req.json()

    const weakTopicsContext =
      weakTopics && weakTopics.length > 0
        ? `\n\nThe student is struggling with these topics: ${weakTopics
            .map((t: any) => `${t.topic_code} - ${t.title}`)
            .join(", ")}. Consider suggesting revision for these areas when relevant.`
        : ""

    const prompt = `You are an expert A-level tutor specializing in Edexcel Economics, Business, and Politics. Your role is to:
- Explain concepts clearly and concisely
- Provide examples and real-world applications
- Identify knowledge gaps and suggest areas to focus on
- Encourage and motivate students
- Use the Edexcel specification terminology${weakTopicsContext}

Student's question: ${message}

Provide a helpful, encouraging response. Keep it concise (2-3 paragraphs max).`

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error("[v0] Error in tutor:", error)
    return Response.json({ error: "Failed to get response" }, { status: 500 })
  }
}
