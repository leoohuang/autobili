import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("MISSING_OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}
