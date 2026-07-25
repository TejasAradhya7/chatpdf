import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getSupabaseUrl } from "@/lib/supabase-storage";
import { NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

// /api/create-chat
export async function POST(req: Request, res: Response) {
  const userId = "user_default";
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }
    const { file_key, file_name } = body;
    if (!file_key || !file_name) {
      return NextResponse.json({ error: "file_key and file_name are required" }, { status: 400 });
    }
    console.log("Processing chat creation for:", file_key, file_name);
    const pages = await loadS3IntoPinecone(file_key);
    
    let summary = "Summary could not be generated.";
    if (pages && pages.length > 0) {
      const firstPageContent = pages.map((p: any) => p.pageContent).join(" ");
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const prompt = `You are an AI assistant tasked with summarizing documents. Provide a short, 3-bullet point summary of the following document to extract key insights. Document content: ${firstPageContent.slice(0, 4000)}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if (text) {
          summary = text;
        } else {
          summary = `• ${firstPageContent.slice(0, 250).trim()}...\n• Document indexed for AI question answering.`;
        }
      } catch (summaryErr) {
        summary = `• ${firstPageContent.slice(0, 250).trim()}...\n• Document indexed for AI question answering.`;
        console.warn("Summary generation error (non-fatal):", summaryErr);
      }
    }

    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getSupabaseUrl(file_key),
        userId,
        summary,
      })
      .returning({
        insertedId: chats.id,
      });

    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
