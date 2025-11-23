import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { question, answer, markScheme, maxMarks, questionType, correctAnswer } =
      await req.json();

    // =====================================
    // 1. MULTIPLE CHOICE MARKING
    // =====================================
    if (questionType === "multiple_choice") {
      const student = answer?.trim().toLowerCase();
      const correct = correctAnswer?.trim().toLowerCase();
      const isCorrect = student === correct;

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? "Correct! Great job — you clearly understood this question."
          : `Not quite. The correct answer is **${correctAnswer}**. Review this topic to understand why that option is correct.`,
      });
    }

    // =====================================
    // 2. CALCULATION MARKING
    // =====================================
    if (questionType === "calculation") {
      const studentNum = Number.parseFloat(answer?.replace(/[^0-9.-]/g, "") || "0");
      const correctNum = Number.parseFloat(correctAnswer?.replace(/[^0-9.-]/g, "") || "0");

      const tolerance = Math.abs(correctNum * 0.01); // 1% tolerance
      const isCorrect = Math.abs(studentNum - correctNum) <= tolerance;

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? `Correct! Your answer of **${answer}** is within the acceptable range. Nice work.`
          : `Your calculation doesn't seem correct. The accurate answer is **${correctAnswer}**. Try redoing the steps carefully.`,
      });
    }

    // =====================================
    // 3. AI MARKING (DEFAULT)
    //    This runs if NOT MCQ or Calculation
    // =====================================

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
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
- Be friendly, clear and supportive for a 16–18 year old student.
- Highlight strengths AND improvements.
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
    // Supports:
    //  "Final Mark: 6/12"
    //  "Awarded 7 / 10"
    //  "I would give 5/8"
    //  "Score: 9 of 15"
    // =====================================

    // Matches: 6/12, 7 / 10, 5 /8, etc.
    const fractionRegex = /(\d{1,3})\s*\/\s*(\d{1,3})/;

    // Matches: "7 out of 12"
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
