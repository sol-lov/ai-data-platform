import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createCerebras } from "@ai-sdk/cerebras";

function getProvider() {
  const provider = process.env.PROVIDER?.toLowerCase();

  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.OPENAI_BASE_URL;

  switch (provider) {
    case "cerebras":
      return createCerebras({
        apiKey,
        baseURL
      });

    case "openai":
    default:
      return createOpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || "https://effective-couscous-j757pqq7wvjf7qr-11434.app.github.dev/v1",
      });
  }
}




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
  const provider = getProvider();
  const modelId = modelName || process.env.MODEL_NAME || "gpt-oss:120b-cloud";

  const { text } = await generateText({
    model: provider(modelId),
    prompt: `${systemPrompt}\n\nUser: ${userPrompt}`,
  });

  return text;
}

