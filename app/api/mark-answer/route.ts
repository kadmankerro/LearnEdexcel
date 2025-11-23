import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const {
      question,
      answer,
      markScheme,
      maxMarks
    } = await req.json();

    // =====================================
    // AI MARKING (ALWAYS — DEFAULT FOR ALL QUESTIONS)
    // =====================================

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",  // FREE + SUPPORTED
      messages: [
        {
          role: "system",
          content: `
You are an Edexcel A-Level examiner. 
Mark strictly using Edexcel assessment objectives:

AO1 — Knowledge & understanding  
AO2 — Application  
AO3 — Analysis  
AO4 — Evaluation (where relevant)

Rules:
- Follow the provided mark scheme EXACTLY.
- Do NOT award marks outside the scheme.
- Give a final mark out of ${maxMarks}.
- Provide AO1/AO2/AO3/AO4 justification.
- Be friendly, clear, and supportive for a 16–18 year old.
- Highlight strengths AND how to improve.
`
        },
        {
          role: "user",
          content: `
Mark this A-Level answer using the Edexcel specification.

Question:
${question}

Mark Scheme:
${markScheme}

Student Answer:
${answer}

Maximum Marks: ${maxMarks}

Return your answer in this exact format:

1. Final Mark: X/${maxMarks}
2. AO Breakdown:
   - AO1:
   - AO2:
   - AO3:
   - AO4:
3. Student Feedback (friendly and age-appropriate)
`
        }
      ],
      temperature: 0.2,
    });

    const feedback = completion.choices[0].message?.content || "";

    // =====================================
    // AUTO MARK EXTRACTION
    // Supports formats like:
    // "Final Mark: 6/12"
    // "Score = 5 / 8"
    // "Awarded 7 out of 10"
    // =====================================

    const fractionRegex = /(\d{1,3})\s*\/\s*(\d{1,3})/;
    const outOfRegex = /(\d{1,3})\s*out\s*of\s*(\d{1,3})/i;

    let extractedMark = 0;

    let match = feedback.match(fractionRegex);
    if (!match) match = feedback.match(outOfRegex);

    if (match) {
      const mark = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);

      if (!isNaN(mark) && !isNaN(total)) {
        if (total === maxMarks) {
          extractedMark = Math.min(mark, maxMarks);
        }
      }
    }

    return Response.json({
      marks: extractedMark,
      feedback,
    });

  } catch (err) {
    console.error("[AI Marker Error]", err);
    return Response.json(
      {
        error: "Failed to mark answer.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
