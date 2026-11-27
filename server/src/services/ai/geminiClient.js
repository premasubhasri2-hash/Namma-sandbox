// Thin wrapper around the Gemini REST API (generateContent). Everything that
// talks to Google lives here, so the provider can be swapped in one place.
// The API key is sent in a header and is never logged.

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

const httpError = (status, message) => Object.assign(new Error(message), { status });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getModelName = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;
export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

function extractJson(payload) {
  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw httpError(502, "Gemini returned no text (the response may have been blocked)");
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(502, "Gemini returned invalid JSON");
  }
}

export async function generateJson({
  systemInstruction,
  userText,
  image,
  responseSchema,
  timeoutMs = 25000,
  maxRetries = 1,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw httpError(503, "GEMINI_API_KEY is not set");

  const parts = [{ text: userText }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  });
  const url = `${API_BASE}/${getModelName()}:generateContent`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: controller.signal,
      });
      if (response.ok) return extractJson(await response.json());

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < maxRetries) {
        await sleep(1500);
        continue;
      }
      throw httpError(502, `Gemini request failed (HTTP ${response.status})`);
    } catch (error) {
      if (error.name === "AbortError") {
        if (attempt < maxRetries) continue;
        throw httpError(504, "Gemini request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw httpError(502, "Gemini request failed");
}