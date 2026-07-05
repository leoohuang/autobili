import OpenAI from "openai";

const OPENAI_MODELS = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
]);

function getValidatedModel(): string {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  if (!OPENAI_MODELS.has(model)) {
    console.warn(
      `[openai] Unknown model "${model}" from OPENAI_MODEL env var. ` +
      `Known models: ${[...OPENAI_MODELS].join(", ")}. Proceeding anyway.`,
    );
  }
  return model;
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("MISSING_OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel(): string {
  return getValidatedModel();
}
