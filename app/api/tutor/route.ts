import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { studentMessage, question, userId, weakTopics } = await req.json();

    // ================
    // Supabase client
    // ================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ================
    // Load mini-memory
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
Last topic: ${lastTopic || "None"}.
Last confusion: ${lastConfusion || "None"}.
Last tip: ${lastTip || "None"}.
`;

    const weakTopicsContext =
      weakTopics && weakTopics.length > 0
        ? `The student is weaker in: ${weakTopics
            .map((t: any) => `${t.topic_code} - ${t.title}`)
            .join(", ")}. Keep this in mind.`
        : "";

    // ================
    // AI tutor call
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

Your style:
- Short, simple sentences (2–3 max).
- Explain the idea clearly.
- Refer to the *exact exam question*.
- Ask 1–2 guiding questions.
- Do NOT give the full answer.
- Encourage the student.
- Keep it exam-relevant.
- Use Edexcel terminology.
${weakTopicsContext}

Mini-memory:
${miniMemoryString}
`
        },
        {
          role: "user",
          content: `
The student is trying to answer this exam question:
"${question}"

They said:
"${studentMessage}"

Give a short explanation that helps them understand THIS question.
Ask 1–2 questions to guide them.
Do NOT reveal the full answer.
`
        }
      ],
      temperature: 0.4,
    });

    const response = completion.choices[0].message?.content || "";

    // ================
    // Update Mini-Memory
    // ================
    const detectedTopic = question?.split(" ").slice(0, 5).join(" ");

    const newConfusion =
      studentMessage.length > 80
        ? studentMessage.slice(0, 80) + "..."
        : studentMessage;

    const firstTipSentence = response.split(".")[0] + ".";

    if (userId) {
      await supabase.from("tutor_mini_memory").upsert({
        user_id: userId,
        last_topic: detectedTopic,
        last_confusion: newConfusion,
        last_tip: firstTipSentence,
        updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ response });

  } catch (error) {
    console.error("[Tutor Error]", error);
    return Response.json({ error: "Failed to get tutor response" }, { status: 500 });
  }
}
