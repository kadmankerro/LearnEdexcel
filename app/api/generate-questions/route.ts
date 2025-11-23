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
    const { topicId, count, forceType } = await req.json();

    if (!topicId) {
      return Response.json(
        { error: "topicId is required." },
        { status: 400 }
      );
    }

    if (!count || count < 1 || count > 30) {
      return Response.json(
        { error: "count should be between 1 and 30 to avoid timeouts." },
        { status: 400 }
      );
    }

    // Get topic data
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      return Response.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    // Get theme
    const { data: theme } = await supabase
      .from("themes")
      .select("*")
      .eq("id", topic.theme_id)
      .single();

    // Get subject
    const { data: subject } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", theme.subject_id)
      .single();

    // -------- forceType INSTRUCTION --------
    let forcedTypeInstruction = "";

    if (forceType) {
      forcedTypeInstruction = `
IMPORTANT REQUIREMENT:
You MUST generate ONLY questions using the following Edexcel question type:

question_type = "${forceType}"

Allowed values:
- "short_answer"
- "multiple_choice"
- "essay"
- "calculation"

Every question MUST use this type. No exceptions.
`;
    }

    // ------------------------------------------
    // PROMPT FOR GROQ
    // ------------------------------------------

    const systemPrompt = `
You are an Edexcel A-Level question writer for ${subject.name}.
Write ONLY original questions (never copy real exam papers).
Ensure all content is 100% correct, syllabus-accurate, and exam-appropriate.

RETURN STRICT JSON ONLY.
FORMAT:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "...",
      "difficulty": "...",
      "marks": number,
      "correct_answer": "...",
      "explanation": "...",
      "mark_scheme": "..."
    }
  ]
}

Rules:
- Use realistic difficulty labels: "easy", "medium", "hard".
- For multiple_choice: include the correct option letter.
- For calculation: give full correct working + number.
- For essays: leave "correct_answer" empty but give strong mark scheme + explanation.
- Mark schemes MUST follow Edexcel style (Level 1/2/3/etc).
- NEVER include markdown, backticks, commentary, or anything outside JSON.
`;

    const userPrompt = `
Subject: ${subject.name} (${subject.code})
Theme: ${theme.title}
Topic: ${topic.title}

${forcedTypeInstruction}

Topic Content:
${topic.content}

Generate exactly ${count} high-quality original questions.
ALL questions must be aligned ONLY to this topic.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const raw = completion.choices[0].message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ BAD JSON:", raw);
      return Response.json(
        { error: "Model returned invalid JSON.", raw },
        { status: 500 }
      );
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return Response.json(
        { error: "JSON missing questions array.", raw: parsed },
        { status: 500 }
      );
    }

    // ---- DUPLICATE CHECK: load existing question_text for this topic ----
    const { data: existing, error: existingErr } = await supabase
      .from("questions")
      .select("question_text")
      .eq("topic_id", topicId);

    if (existingErr) {
      console.error("Error fetching existing questions:", existingErr);
    }

    const existingSet = new Set(
      (existing || [])
        .map((q: any) => q.question_text?.trim().toLowerCase())
        .filter(Boolean)
    );

    // Prepare rows for DB, skipping duplicates
    const now = new Date().toISOString();

    const rowsToInsert = parsed.questions
      .filter((q: any) => {
        const key = (q.question_text || "").trim().toLowerCase();
        if (!key) return false;
        if (existingSet.has(key)) {
          // Already have this question for this topic
          return false;
        }
        existingSet.add(key); // avoid duplicates within this batch too
        return true;
      })
      .map((q: any) => ({
        topic_id: topicId,
        question_text: q.question_text ?? "",
        question_type: q.question_type ?? forceType ?? "short_answer",
        difficulty: q.difficulty ?? "medium",
        marks: q.marks ?? 2,
        correct_answer: q.correct_answer ?? "",
        explanation: q.explanation ?? "",
        mark_scheme: q.mark_scheme ?? "",
        created_at: now
      }));

    if (rowsToInsert.length === 0) {
      return Response.json({
        message: "No new unique questions to insert (all were duplicates).",
        insertedCount: 0
      });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("questions")
      .insert(rowsToInsert)
      .select("*");

    if (insertErr) {
      return Response.json(
        { error: "Failed to insert questions.", details: insertErr },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Questions generated & inserted successfully.",
      insertedCount: inserted.length
    });

  } catch (err: any) {
    console.error("❌ generate-questions error:", err);
    return Response.json(
      { error: "Unexpected server error.", details: err.message },
      { status: 500 }
    );
  }
}
