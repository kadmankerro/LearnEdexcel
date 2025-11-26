import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Calculate next review date based on spaced repetition algorithm
function calculateNextReview(reviewCount: number, confidenceLevel: number): Date {
  const now = new Date()
  let daysToAdd = 1

  // Spaced repetition intervals based on performance
  if (confidenceLevel >= 80) {
    // High confidence - longer intervals
    const intervals = [1, 3, 7, 14, 30, 60, 90]
    daysToAdd = intervals[Math.min(reviewCount, intervals.length - 1)]
  } else if (confidenceLevel >= 50) {
    // Medium confidence - moderate intervals
    const intervals = [1, 2, 4, 7, 14, 21, 30]
    daysToAdd = intervals[Math.min(reviewCount, intervals.length - 1)]
  } else {
    // Low confidence - shorter intervals
    const intervals = [1, 1, 2, 3, 5, 7, 14]
    daysToAdd = intervals[Math.min(reviewCount, intervals.length - 1)]
  }

  now.setDate(now.getDate() + daysToAdd)
  return now
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, topicId, marksAwarded, maxMarks } = await req.json()

    // Calculate confidence level (percentage correct)
    const confidenceLevel = Math.round((marksAwarded / maxMarks) * 100)

    // Check if this question is already in the queue
    const { data: existingItem } = await supabase
      .from("active_recall_queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .single()

    const now = new Date().toISOString()

    if (existingItem) {
      // Update existing item
      const reviewCount = existingItem.review_count + 1
      const nextReview = calculateNextReview(reviewCount, confidenceLevel)

      await supabase
        .from("active_recall_queue")
        .update({
          last_attempted: now,
          next_review_date: nextReview.toISOString(),
          review_count: reviewCount,
          confidence_level: confidenceLevel,
        })
        .eq("id", existingItem.id)
    } else {
      // Add new item to queue
      const nextReview = calculateNextReview(0, confidenceLevel)

      await supabase.from("active_recall_queue").insert({
        user_id: user.id,
        question_id: questionId,
        topic_id: topicId,
        last_attempted: now,
        next_review_date: nextReview.toISOString(),
        review_count: 1,
        confidence_level: confidenceLevel,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Active recall error:", error)
    return NextResponse.json({ error: "Failed to update active recall" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get("topicId")

    // Get questions due for review
    let query = supabase
      .from("active_recall_queue")
      .select(
        `
        *,
        questions (*),
        topics (id, topic_code, title)
      `,
      )
      .eq("user_id", user.id)
      .lte("next_review_date", new Date().toISOString())
      .order("next_review_date")

    if (topicId) {
      query = query.eq("topic_id", Number.parseInt(topicId))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error("[v0] Get active recall error:", error)
    return NextResponse.json({ error: "Failed to fetch active recall items" }, { status: 500 })
  }
}
