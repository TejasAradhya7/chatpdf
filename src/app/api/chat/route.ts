import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, GoogleGenerativeAIStream, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Edge runtime removed to fix fs module dependency issues in Langchain

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    let fileKey = "";
    try {
      const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
      if (_chats.length > 0) {
        fileKey = _chats[0].fileKey;
      }
    } catch (dbErr) {
      console.warn("Database lookup warning in chat route (non-fatal):", dbErr);
    }

    const lastMessage = messages[messages.length - 1];
    let context = "";
    if (fileKey) {
      try {
        context = await getContext(lastMessage.content, fileKey);
      } catch (contextErr) {
        console.warn("Context retrieval warning (non-fatal):", contextErr);
      }
    }

    const prompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will answer using its general knowledge.
      CRITICAL: You MUST include citations for your claims in the format [Page X] when drawing from context.
      `;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: prompt,
    });

    const geminiMessages = messages.filter((m: Message) => m.role === "user" || m.role === "assistant" || m.role === "system").map((m: Message) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
    
    const responseStream = await model.generateContentStream({
      contents: geminiMessages,
    });

    const stream = GoogleGenerativeAIStream(responseStream, {
      onStart: async () => {
        try {
          await db.insert(_messages).values({
            chatId,
            content: lastMessage.content,
            role: "user",
          });
        } catch (e) {
          console.warn("Non-fatal DB message insert error (user):", e);
        }
      },
      onCompletion: async (completion) => {
        try {
          await db.insert(_messages).values({
            chatId,
            content: completion,
            role: "system",
          });
        } catch (e) {
          console.warn("Non-fatal DB message insert error (system):", e);
        }
      },
    });
    return new StreamingTextResponse(stream);
  } catch (error: any) {
    const errorDetails = error?.message || String(error);
    console.error("Chat API error:", errorDetails);
    
    const fallbackMsg = `⚠️ AI Assistant Notice: ${errorDetails}\n\nRe-submitting your request...`;
    
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackMsg));
        controller.close();
      }
    });
    return new StreamingTextResponse(fallbackStream);
  }
}
