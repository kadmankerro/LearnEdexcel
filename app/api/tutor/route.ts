import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { message, weakTopics } = await req.json();

    const weakTopicsContext =
      weakTopics && weakTopics.length > 0
        ? `The student is weaker in: ${weakTopics
            .map((t: any) => `${t.topic_code} - ${t.title}`)
            .join(", ")}.`
        : "";

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a helpful A-Level tutor for Edexcel Economics, Business and Politics.
Your goal is to help students UNDERSTAND — not give full answers.

Teaching style:
- Short, simple sentences.
- 2–3 sentences max per response.
- Explain the idea briefly.
- Give an example when useful.
- Ask one or two guiding questions.
- Encourage the student.
- Never reveal the full exam answer.
- Use Edexcel terminology.
${weakTopicsContext}
`
        },
        {
          role: "user",
          content: `
The student asked: "${message}"

Give a short explanation and ask 1–2 helpful questions to guide them.
Do NOT give the full answer.
`
        }
      ],
      temperature: 0.4,
    });

    const response = completion.choices[0].message?.content || "";

    return Response.json({ response });

  } catch (error) {
    console.error("[Tutor Error]", error);
    return Response.json({ error: "Failed to get response" }, { status: 500 });
  }
}
