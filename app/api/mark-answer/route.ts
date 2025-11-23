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
    // AI MARKING FOR ALL QUESTION TYPES
    // =====================================

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are an Edexcel A-Level examiner. 
Mark answers using AO1, AO2, AO3 and AO4 —
BUT always keep responses short and simple.

Rules for writing:
- Each AO point = 1 short sentence.
- Feedback = 1–2 short friendly sentences.
- Never write long paragraphs.
- Never be overly formal.
- Always encourage the student.
- Return ONLY the following format:

Final Mark: X/Y
AO1: ...
AO2: ...
AO3: ...
AO4: ...
Feedback: ...
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

Max Marks: ${maxMarks}

Return ONLY in this compact format:

Final Mark: X/${maxMarks}
AO1: (short sentence)
AO2: (short sentence)
AO3: (short sentence or "Not needed")
AO4: (short sentence or "Not needed")
Feedback: (1–2 short sentences max)
`
        }
      ],
      temperature: 0.2,
    });

    const feedback = completion.choices[0].message?.content || "";

    // =====================================
    // AUTO MARK EXTRACTION
    // =====================================

    const fractionRegex = /(\d+)\s*\/\s*(\d+)/;
    const outOfRegex = /(\d+)\s*out\s*of\s*(\d+)/i;

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
