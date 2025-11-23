// RUN THIS TO GENERATE THOUSANDS OF QUESTIONS IN 70/20/10 DISTRIBUTION
// Save as: scripts/generateAllQuestions.js
// Run with: node scripts/generateAllQuestions.js

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// CHANGE THIS TO YOUR DEPLOYED URL:
const BASE_URL = "https://v0-economics-business-website.vercel.app";

// HOW MANY PASSES PER TOPIC (5 passes = ~100 questions/topic)
const PASSES = 5;

// DISTRIBUTION PER PASS (TOTAL = 20)
const SHORT_ANSWER_Q = 14;  // 70%
const MCQ_Q = 4;            // 20%
const ESSAY_Q = 2;          // 10%

// Topic list based on your DB content
const TOPIC_IDS = [
  1,2,3,4,5,6,7,8,9,10,11,
  12,13,14,15,16,17,
  18,19,20,21,
  22,23,24,
  25,26,27,28,
  29,30,31,32,33,34,35,36,37,38,39,40,
  41,42,43,44,
  45,46,
  47,48,49,50,51,52,53,54,55,56,57,
  58,59,60,61,
  62,63
];

const PROGRESS_FILE = path.join(__dirname, "generate_progress.json");

// ---- Progress helpers (resume support) ----
function readProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      let topicIndex = parsed.topicIndex ?? 0;
      let pass = parsed.pass ?? 1;

      if (topicIndex >= TOPIC_IDS.length) {
        topicIndex = 0;
        pass = 1;
      }

      console.log(
        `🔁 Resuming from topic index ${topicIndex} (topicId=${TOPIC_IDS[topicIndex]}), pass ${pass}`
      );
      return { topicIndex, pass };
    }
  } catch (err) {
    console.log("⚠️ Could not read progress file, starting fresh.", err.message);
  }
  console.log("🆕 No progress file found, starting from the beginning.");
  return { topicIndex: 0, pass: 1 };
}

function saveProgress(topicIndex, pass) {
  const data = { topicIndex, pass };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ---- API call with retry logic ----
async function generateBatch(topicId, type, amount, passNum) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const res = await fetch(`${BASE_URL}/api/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          count: amount,
          forceType: type
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(
          `✔ Topic ${topicId} | ${type} ×${amount} | Pass ${passNum} (Attempt ${attempts})`
        );
        return;
      }

      console.log(
        `⚠️ ERROR (Attempt ${attempts}/${maxAttempts}) Topic ${topicId}, Pass ${passNum}:`,
        data.error || data.details
      );

    } catch (err) {
      console.log(
        `⚠️ NETWORK ERROR (Attempt ${attempts}/${maxAttempts}) Topic ${topicId}, Pass ${passNum}:`,
        err.message
      );
    }

    const delay = 1500 * attempts;
    console.log(`⏳ Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  console.log(
    `❌ FAILED Topic ${topicId}, Pass ${passNum} after ${maxAttempts} attempts. Skipping batch.`
  );
}

// ---- Main runner (with resume) ----
(async () => {
  console.log("🚀 Starting bulk generation with 70/20/10 distribution...");
  console.log("-------------------------------------------");

  let { topicIndex, pass } = readProgress();

  for (let i = topicIndex; i < TOPIC_IDS.length; i++) {
    const topicId = TOPIC_IDS[i];
    const startPass = i === topicIndex ? pass : 1;

    for (let p = startPass; p <= PASSES; p++) {
      // short-answer
      await generateBatch(topicId, "short_answer", SHORT_ANSWER_Q, p);
      await new Promise((r) => setTimeout(r, 2000));

      // MCQ
      await generateBatch(topicId, "multiple_choice", MCQ_Q, p);
      await new Promise((r) => setTimeout(r, 2000));

      // essay
      await generateBatch(topicId, "essay", ESSAY_Q, p);
      await new Promise((r) => setTimeout(r, 2000));

      // Save progress after finishing this pass for this topic
      saveProgress(i, p + 1);
    }

    // After finishing all passes for this topic, move to next topic, pass 1
    saveProgress(i + 1, 1);
  }

  console.log("🎉 DONE — all topics and passes completed.");

  // Clean up progress file at the end (optional)
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log("🧹 Progress file removed (run fully complete).");
    }
  } catch (err) {
    console.log("⚠️ Could not delete progress file:", err.message);
  }
})();
