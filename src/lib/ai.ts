import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL:
    process.env.OPENAI_BASE_URL ||
    "https://effective-couscous-j757pqq7wvjf7qr-11434.app.github.dev/v1",
  apiKey: process.env.OPENAI_API_KEY || "",
});

type GenerateArgs = {
  systemPrompt: string;
  userPrompt: string;
  modelName?: string;
};

export async function generateAiText({
  systemPrompt,
  userPrompt,
  modelName,
}: GenerateArgs) {
  const modelId = modelName || process.env.MODEL_NAME || "gpt-oss:120b-cloud";

  const { text } = await generateText({
    model: openai(modelId),
    prompt: `${systemPrompt}\n\nUser: ${userPrompt}`,
  });

  return text;
}

