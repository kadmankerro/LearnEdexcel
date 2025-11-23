import OpenAI from "openai/index.mjs";

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
          : `Not quite. The correct answer is **${correctAnswer}**. Have another look at this topic to see why that option is right.`,
      });
    }

    // ================================
    // 2. CALCULATION MARKING
    // ================================
    if (questionType === "calculation") {
      const studentNum = Number.parseFloat(answer?.replace(/[^0-9.-]/g, "") || "0");
      const correctNum = Number.parseFloat(correctAnswer?.replace(/[^0-9.-]/g, "") || "0");

      const tolerance = Math.abs(correctNum * 0.01); // 1% tolerance
      const isCorrect = Math.abs(studentNum - correctNum) <= tolerance;

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? `Correct! Your answer of **${answer}** is within the expected range. Nice calculation.`
          : `Your calculation is a bit off. The correct answer is **${correctAnswer}**. Double-check the formula and try again.`,
      });
    }

    // ================================
    // 3. AI MARKING (Edexcel A-Level)
    // ================================
    if (questionType === "ai") {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const aiReply = await client.chat.completions.create({
        model: "gpt-4o-mini",
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

Instructions:
• Follow the mark scheme EXACTLY as provided.  
• Do NOT invent criteria or add marks outside the scheme.  
• Keep your tone supportive and clear for a 16–18 year old student.  
• Justify every mark using AO1/AO2/AO3/AO4.  
• Be concise, fair, and educational.  
`,
          },
          {
            role: "user",
            content: `
Mark the following A-Level answer according to the Edexcel specification.

Question:
${question}

Mark Scheme:
${markScheme}

Student Answer:
${answer}

Maximum Marks: ${maxMarks}

Please return your response in this format:

1. **Final Mark: X/${maxMarks}**
2. **AO Breakdown**
   - AO1:
   - AO2:
   - AO3:
   - AO4: (if relevant)
3. **Student Feedback**
   - Friendly 16–18 year old tone
   - Explain what they did well
   - Explain how to improve
`,
          },
        ],
      });

      const feedback = aiReply.choices[0].message.content || "No feedback generated.";

      return Response.json({
        marks: maxMarks, // If you want auto-mark extraction, I can add that next.
        feedback,
      });
    }

    // ================================
    // If no valid questionType provided
    // ================================
    return Response.json(
      { error: "Invalid question type or missing parameters." },
      { status: 400 }
    );

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
