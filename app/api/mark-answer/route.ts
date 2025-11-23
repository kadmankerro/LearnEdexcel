import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { question, answer, markScheme, maxMarks, questionType, correctAnswer } = await req.json();

    // ================================
    // 1. MULTIPLE CHOICE MARKING
    // ================================
    if (questionType === "multiple_choice") {
      const student = answer?.trim().toLowerCase();
      const correct = correctAnswer?.trim().toLowerCase();
      const isCorrect = student === correct;

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? "Correct! Great job — you clearly understood this question."
          : `Not quite. The correct answer is **${correctAnswer}**. Review this topic to understand why that option is right.`,
      });
    }

    // ================================
    // 2. CALCULATION MARKING
    // ================================
    if (questionType === "calculation") {
      const studentNum = Number.parseFloat(answer?.replace(/[^0-9.-]/g, "") || "0");
      const correctNum = Number.parseFloat(correctAnswer?.replace(/[^0-9.-]/g, "") || "0");

      const tolerance = Math.abs(correctNum * 0.01);
      const isCorrect = Math.abs(studentNum - correctNum) <= tolerance;

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? `Correct! Your answer of **${answer}** is within the acceptable range. Nice work.`
          : `Your calculation doesn't seem correct. The accurate answer is **${correctAnswer}**. Try redoing the steps carefully.`,
      });
    }

    // ================================
    // 3. AI MARKING — LLAMA 3 (FREE)
    // ================================
    if (questionType === "ai") {
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });

      const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
You are an Edexcel A-Level examiner. 
Mark strictly using Edexcel assessment objectives:

AO1 — Knowledge & understanding  
AO2 — Application  
AO3 — Analysis  
AO4 — Evaluation (if required)

Rules:
- Follow the provided mark scheme EXACTLY.
- Do not award marks outside the scheme.
- Give a final mark out of ${maxMarks}.
- Provide a clear AO1/AO2/AO3/AO4 breakdown.
- Tone must be friendly, clear, and suitable for a 16–18 year old.
- Encourage improvement.
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

Return your answer in this format:

1. Final Mark: X/${maxMarks}
2. AO Breakdown:
   - AO1:
   - AO2:
   - AO3:
   - AO4: (if needed)
3. Student Feedback (friendly and age-appropriate)
`
          }
        ],
        temperature: 0.2
      });

      const feedback = completion.choices[0].message?.content || "";

      // ================================
      // AUTO MARK EXTRACTION
      // ================================
      const markRegex = /(\b\d{1,3})\s*\/\s*(\d{1,3})/; 
      const match = feedback.match(markRegex);

      let extractedMark = 0;

      if (match) {
        const mark = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);

        if (!isNaN(mark) && !isNaN(total) && total === maxMarks) {
          extractedMark = Math.min(mark, maxMarks);
        }
      }

      return Response.json({
        marks: extractedMark,
        feedback
      });
    }

    return Response.json(
      { error: "Invalid question type." },
      { status: 400 }
    );

  } catch (err) {
    console.error("[Llama Marker Error]", err);
    return Response.json(
      {
        error: "Failed to mark answer.",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
