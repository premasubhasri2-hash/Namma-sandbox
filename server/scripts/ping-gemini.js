// Checks that Node can reach Gemini and how long a call takes.
//   node --env-file=.env scripts/ping-gemini.js                      -> tiny test
//   node --env-file=.env scripts/ping-gemini.js structured           -> same kind of request the app sends
//   node --env-file=.env scripts/ping-gemini.js structured MODEL     -> try another model

const key = process.env.GEMINI_API_KEY;
const mode = process.argv[2] ?? "tiny";
const model = process.argv[3] ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const tiny = { contents: [{ parts: [{ text: "Reply with exactly: OK" }] }] };

const structured = {
  systemInstruction: {
    parts: [{ text: "You assess road disruption reports. Never claim a road is officially closed. Return JSON only." }],
  },
  contents: [
    {
      role: "user",
      parts: [
        {
          text: 'Report: """Heavy waterlogging on Northern Cross, one lane is blocked and traffic is crawling."""',
        },
      ],
    },
  ],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          enum: ["waterlogging", "road_closure", "construction", "public_gathering", "accident", "other"],
        },
        severity: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
        summary: { type: "STRING" },
        confidence: { type: "NUMBER" },
        needsVerification: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["category", "severity", "summary", "confidence", "needsVerification"],
    },
    temperature: 0.2,
    maxOutputTokens: 4096,
  },
};

console.log(`Model: ${model}   Mode: ${mode}`);
const started = Date.now();
try {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(mode === "structured" ? structured : tiny),
    signal: AbortSignal.timeout(90000),
  });
  const payload = await response.json();
  console.log(`HTTP ${response.status} in ${Date.now() - started} ms`);
  if (!response.ok) {
    console.log(JSON.stringify(payload).slice(0, 400));
  } else {
    const candidate = payload.candidates?.[0];
    console.log("finishReason:", candidate?.finishReason);
    console.log("usage:", JSON.stringify(payload.usageMetadata));
    console.log((candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "").slice(0, 400));
  }
} catch (error) {
  console.log(`FAILED after ${Date.now() - started} ms:`, error.name, error.message, error.cause?.code ?? "");
}