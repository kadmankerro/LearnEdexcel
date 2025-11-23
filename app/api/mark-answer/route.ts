export async function POST(req: Request) {
  try {
    const { question, answer, markScheme, maxMarks, questionType, correctAnswer } = await req.json()

    // Multiple choice questions - exact match
    if (questionType === "multiple_choice") {
      const studentAnswer = answer?.trim().toLowerCase()
      const correct = correctAnswer?.trim().toLowerCase()
      const isCorrect = studentAnswer === correct

      return Response.json({
        marks: isCorrect ? maxMarks : 0,
        feedback: isCorrect
          ? "Correct! Well done."
          : `Incorrect. The correct answer is ${correctAnswer}. Review the topic to understand why this is the correct choice.`,
      })
    }

    // Calculation questions - check for numerical answers
    if (questionType === "calculation") {
      const studentAnswer = answer?.trim()
      const correctAns = correctAnswer?.trim()

      // Extract numbers from both answers
      const studentNum = Number.parseFloat(studentAnswer?.replace(/[^0-9.-]/g, "") || "0")
      const correctNum = Number.parseFloat(correctAns?.replace(/[^0-9.-]/g, "") || "0")

      // Check if answer is close (within 1% tolerance)
      const tolerance = Math.abs(correctNum * 0.01)
      const isCorrect = Math.abs(studentNum - correctNum) <= tolerance

      if (isCorrect) {
        return Response.json({
          marks: maxMarks,
          feedback: `Correct! Your answer of ${studentAnswer} matches the expected result. Great work with your calculations.`,
        })
      } else {
        return Response.json({
          marks: 0,
          feedback: `Incorrect. The correct answer is ${correctAnswer}. Check your calculations and ensure you've used the correct formula. Review the working to identify where the error occurred.`,
        })
      }
    }

    // Short answer and essay questions - keyword-based marking
    const studentAnswer = answer?.toLowerCase() || ""
    const scheme = markScheme?.toLowerCase() || ""

    // Extract keywords from mark scheme (words in quotes or capital emphasis)
    const keywords: string[] = []
    const quotedMatches = scheme.match(/"([^"]+)"|'([^']+)'/g)
    if (quotedMatches) {
      quotedMatches.forEach((match) => {
        keywords.push(match.replace(/['"]/g, "").toLowerCase())
      })
    }

    // Add common economic/business/political terms from the mark scheme
    const commonTerms = [
      "supply",
      "demand",
      "elasticity",
      "market",
      "competition",
      "monopoly",
      "externality",
      "inflation",
      "unemployment",
      "gdp",
      "fiscal",
      "monetary",
      "policy",
      "stakeholder",
      "profit",
      "revenue",
      "cost",
      "democracy",
      "parliament",
      "government",
      "election",
      "legislation",
      "constitution",
    ]

    commonTerms.forEach((term) => {
      if (scheme.includes(term)) {
        keywords.push(term)
      }
    })

    // Count keyword matches
    let keywordMatches = 0
    keywords.forEach((keyword) => {
      if (studentAnswer.includes(keyword)) {
        keywordMatches++
      }
    })

    // Calculate marks based on keywords, answer length, and structure
    const minWords = questionType === "essay" ? 100 : 20
    const wordCount = studentAnswer.split(/\s+/).filter((word) => word.length > 0).length
    const hasMinimumLength = wordCount >= minWords

    let marks = 0
    let feedback = ""

    if (keywords.length > 0) {
      const keywordScore = (keywordMatches / keywords.length) * maxMarks
      const lengthBonus = hasMinimumLength ? 0 : -maxMarks * 0.2

      marks = Math.max(0, Math.min(maxMarks, Math.round(keywordScore + lengthBonus)))
    } else {
      // If no keywords found, use simple heuristics
      if (wordCount < minWords) {
        marks = Math.round(maxMarks * 0.3)
      } else if (wordCount >= minWords && wordCount < minWords * 2) {
        marks = Math.round(maxMarks * 0.6)
      } else {
        marks = Math.round(maxMarks * 0.75)
      }
    }

    // Generate feedback
    const percentage = (marks / maxMarks) * 100

    if (percentage >= 80) {
      feedback = `Excellent answer! (${marks}/${maxMarks}) You've demonstrated strong understanding with relevant terminology and well-developed points. ${
        keywordMatches > 0 ? `Key concepts identified: ${keywordMatches}.` : ""
      }`
    } else if (percentage >= 60) {
      feedback = `Good answer. (${marks}/${maxMarks}) You've shown understanding of the topic. To improve: ${
        !hasMinimumLength ? "Expand your answer with more detail. " : ""
      }Include more specific examples and ensure all aspects of the question are addressed.`
    } else if (percentage >= 40) {
      feedback = `Satisfactory attempt. (${marks}/${maxMarks}) Your answer shows some understanding but needs development. ${
        !hasMinimumLength ? "Write more to fully answer the question. " : ""
      }Review the mark scheme and include key terminology and concepts.`
    } else {
      feedback = `Your answer needs significant improvement. (${marks}/${maxMarks}) ${
        !hasMinimumLength ? "Your answer is too brief. " : ""
      }Review the topic content, understand the key concepts, and try to address all parts of the question. Use the textbook reference material to strengthen your understanding.`
    }

    return Response.json({
      marks,
      feedback,
    })
  } catch (error) {
    console.error("[v0] Error marking answer:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json(
      {
        error: "Failed to mark answer",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
