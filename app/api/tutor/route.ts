import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { message, userId, weakTopics } = await req.json();

    // ================
    // Supabase Client
    // ================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ================
    // Load Mini-Memory
    // ================
    let lastTopic = "";
    let lastConfusion = "";
    let lastTip = "";

    if (userId) {
      const { data } = await supabase
        .from("tutor_mini_memory")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        lastTopic = data.last_topic || "";
        lastConfusion = data.last_confusion || "";
        lastTip = data.last_tip || "";
      }
    }

    const miniMemoryString = `
Last topic student asked about: ${lastTopic || "None"}.
Last confusion: ${lastConfusion || "None recorded"}.
Last tip given: ${lastTip || "None yet"}.
`;

    const weakTopicsContext =
      weakTopics && weakTopics.length > 0
        ? `The student is weaker in: ${weakTopics
            .map((t: any) => `${t.topic_code} - ${t.title}`)
            .join(", ")}. Use this when guiding them.`
        : "";

    // ================
    // AI Tutor Call
    // ================
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a friendly A-Level tutor for Edexcel Economics, Business, and Politics.

Tutor style:
- Short, clear sentences (2–3 total).
- Explain simply.
- Ask 1–2 guiding questions.
- Do NOT give full answers.
- Encourage the student.
- Use Edexcel terminology.
- Personalise based on mini-memory.
${weakTopicsContext}

MINI-MEMORY:
${miniMemoryString}
`
        },
        {
          role: "user",
          content: `
The student asked: "${message}".

Give a short explanation and ask guiding questions.
Do NOT give the full exam answer.
`
        }
      ],
      temperature: 0.4,
    });

    const response = completion.choices[0].message?.content || "";

    // =====================
    // Extract NEW mini-memory items
    // =====================

    // Extract topic from the student's question
    const detectedTopic = message?.split(" ").slice(0, 6).join(" ") || "General question";

    // Extract confusion summary (1 short sentence)
    const newConfusion = message.length > 80
      ? message.slice(0, 80) + "..."
      : message;

    // Extract a short tip from the AI response
    const firstSentence = response.split(".")[0] + ".";

    // =====================
    // Save Mini-Memory (TINY STORAGE)
    // =====================
    if (userId) {
      await supabase.from("tutor_mini_memory").upsert({
        user_id: userId,
        last_topic: detectedTopic,
        last_confusion: newConfusion,
        last_tip: firstSentence,
        updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ response });

  } catch (error) {
    console.error("[Tutor Mini-Memory Error]", error);
    return Response.json(
      { error: "Failed to get tutor response" },
      { status: 500 }
    );
  }
}
