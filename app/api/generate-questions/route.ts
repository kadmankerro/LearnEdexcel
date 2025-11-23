import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type QuestionRow = {
  question_text: string;
  question_type: "multiple_choice" | "short_answer" | "calculation" | "essay";
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  correct_answer: string;
  explanation: string;
  mark_scheme: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const topicId = Number(body.topicId);
    const count = Number(body.count ?? 10); // default 10 per call

    if (!topicId || Number.isNaN(topicId)) {
      return Response.json(
        { error: "topicId is required and must be a number." },
        { status: 400 }
      );
    }

    if (count < 1 || count > 30) {
      // keep per-call small to avoid timeouts
      return Response.json(
        { error: "count must be between 1 and 30 per request." },
        { status: 400 }
      );
    }

    // 1) Fetch topic, theme, subject for context
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      return Response.json(
        { error: "Topic not found for given topicId." },
        { status: 404 }
      );
    }

    const { data: theme, error: themeError } = await supabase
      .from("themes")
      .select("*")
      .eq("id", topic.theme_id)
      .single();

    if (themeError || !theme) {
      return Response.json(
        { error: "Theme not found for topic." },
        { status: 500 }
      );
    }

    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", theme.subject_id)
      .single();

    if (subjectError || !subject) {
      return Response.json(
        { error: "Subject not found for theme." },
        { status: 500 }
      );
    }

    // 2) Build a strong prompt for JSON-only Edexcel questions
    const systemPrompt = `
You are an assessment designer for Edexcel A-Level ${subject.name}.
You write accurate, original exam-style questions (NOT copied from past papers)
for the topic described below.

You must:
- Follow Edexcel style and command words.
- Ensure content is factually correct and syllabus-appropriate.
- Use a mix of question types:
  - multiple_choice
  - short_answer
  - calculation (if relevant)
  - essay (analyse/evaluate style)
- Use difficulty labels: "easy", "medium", "hard".
- Provide realistic maximum marks (1–12 typically).
- For multiple_choice, include the correct option letter (A/B/C/D) in "correct_answer".
- For calculation, include the numerical answer plus unit/brief working in "correct_answer".
- For essays, leave "correct_answer" as an empty string but give a strong outline in "explanation" + "mark_scheme".
- Use ONLY information that is accurate for Edexcel A-Level ${subject.name}.

Return STRICT JSON ONLY, no markdown, no commentary, no backticks.

JSON structure:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "multiple_choice" | "short_answer" | "calculation" | "essay",
      "difficulty": "easy" | "medium" | "hard",
      "marks": number,
      "correct_answer": "...",
      "explanation": "...",
      "mark_scheme": "..."
    }
  ]
}
`;

    const userPrompt = `
Subject: ${subject.name} (${subject.code})
Theme: ${theme.title}
Topic: ${topic.title}
Topic detailed content:
${topic.content}

Generate ${count} high-quality questions across a mix of types and difficulties.

Important:
- Questions must align with THIS topic.
- Do NOT copy real past paper questions.
- Make them original but realistic.
- Ensure all economics/business/politics content is correct.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const raw = completion.choices[0].message?.content ?? "";

    let parsed: { questions: QuestionRow[] } | null = null;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse JSON from model:", raw);
      return Response.json(
        {
          error: "Model did not return valid JSON.",
          raw,
        },
        { status: 500 }
      );
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return Response.json(
        {
          error: "Model JSON missing 'questions' array.",
          raw: parsed,
        },
        { status: 500 }
      );
    }

    // 3) Clean & validate questions, then insert into Supabase
    const now = new Date().toISOString();

    const rowsToInsert = parsed.questions.map((q) => ({
      topic_id: topicId,
      question_text: q.question_text?.trim(),
      question_type: q.question_type,
      difficulty: q.difficulty,
      marks: q.marks,
      correct_answer: q.correct_answer ?? "",
      explanation: q.explanation ?? "",
      mark_scheme: q.mark_scheme ?? "",
      created_at: now,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("questions")
      .insert(rowsToInsert)
      .select("*");

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return Response.json(
        { error: "Failed to insert questions into database.", details: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Questions generated and inserted successfully.",
      topic: {
        id: topic.id,
        title: topic.title,
      },
      insertedCount: inserted?.length ?? 0,
    });
  } catch (err) {
    console.error("[generate-questions] Error:", err);
    return Response.json(
      {
        error: "Unexpected error while generating questions.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
