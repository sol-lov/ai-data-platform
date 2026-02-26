import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";
import { generateAiText } from "@/lib/ai";

const bodySchema = z.object({
  datasetId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  message: z.string().min(1),
});

const MAX_ROWS_FOR_PROMPT = 30;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = token ? verifyJwt(token) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const datasetId = req.nextUrl.searchParams.get("datasetId");
    if (!datasetId) {
      return NextResponse.json(
        { error: "datasetId is required" },
        { status: 400 }
      );
    }

    const dataset = await db.dataset.findFirst({
      where: {
        id: datasetId,
        OR: [{ userId: user.id }, { user: { role: "ADMIN" } }],
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session =
      (await db.chatSession.findFirst({
        where: {
          datasetId,
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
      })) ??
      (await db.chatSession.create({
        data: {
          userId: user.id,
          datasetId,
          title: `Chat about ${dataset.name}`,
        },
      }));

    const messages = await db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat history error", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = token ? verifyJwt(token) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { datasetId, sessionId, message } = parsed.data;

    const dataset = await db.dataset.findFirst({
      where: {
        id: datasetId,
        OR: [{ userId: user.id }, { user: { role: "ADMIN" } }],
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session =
      (sessionId &&
        (await db.chatSession.findFirst({
          where: { id: sessionId, userId: user.id },
        }))) ||
      (await db.chatSession.create({
        data: {
          userId: user.id,
          datasetId,
          title: `Chat about ${dataset.name}`,
        },
      }));

    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message,
      },
    });

    const sampleRows = await db.record.findMany({
      where: { datasetId },
      orderBy: { index: "asc" },
      take: MAX_ROWS_FOR_PROMPT,
    });

    const samplePayload = sampleRows.map((r: any) => r.data);

    const systemPrompt = [
      "You are an AI data analyst embedded in a web app.",
      "You are answering questions about a tabular dataset uploaded by the user.",
      `Dataset name: ${dataset.name}`,
      `Total rows: ${dataset.rowCount}`,
      "",
      `You are given up to ${MAX_ROWS_FOR_PROMPT} sample rows as JSON to understand the schema and typical values.`,
      "Use them to infer column meanings and provide explanations.",
      "If the user asks for specific filters or lookups, explain your reasoning and, when appropriate, suggest concrete filters (column/value conditions) that the app could run server-side.",
      "",
      "Sample rows (JSON):",
      JSON.stringify(samplePayload, null, 2),
    ].join("\n");

    const aiText = await generateAiText({
      systemPrompt,
      userPrompt: message,
    });

    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: aiText,
      },
    });

    const messages = await db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat error", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

