// RUN THIS TO GENERATE THOUSANDS OF QUESTIONS IN CUSTOM DISTRIBUTION
// Save as: scripts/generateAllQuestions.js
// Run with: node scripts/generateAllQuestions.js

const fetch = require("node-fetch");

// CHANGE THIS TO YOUR DEPLOYED URL:
const BASE_URL = "https://v0-economics-business-website.vercel.app";

// HOW MANY PASSES PER TOPIC (5 passes = ~100 questions/topic)
const PASSES = 5;

// DISTRIBUTION PER PASS (TOTAL MUST = 20)
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

// Helper function to call your API
async function generateBatch(topicId, type, amount, passNum) {
  const res = await fetch(`${BASE_URL}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicId,
      count: amount,     // how many questions
      forceType: type    // 👈 we will add this in your API soon
    })
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✔ Topic ${topicId} | ${type} ×${amount} | Pass ${passNum}`);
  } else {
    console.log(`✖ ERROR Topic ${topicId} Pass ${passNum}:`, data.error);
  }
}

// Main execution
(async () => {
  console.log("🚀 Starting bulk generation with 70/20/10 distribution...");
  console.log("-------------------------------------------");

  for (const topicId of TOPIC_IDS) {
    for (let pass = 1; pass <= PASSES; pass++) {
      
      await generateBatch(topicId, "short_answer", SHORT_ANSWER_Q, pass);
      await new Promise(r => setTimeout(r, 1500));
      
      await generateBatch(topicId, "multiple_choice", MCQ_Q, pass);
      await new Promise(r => setTimeout(r, 1500));
      
      await generateBatch(topicId, "essay", ESSAY_Q, pass);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log("🎉 DONE — thousands of questions generated!");
})();
