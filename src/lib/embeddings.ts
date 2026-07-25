import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string); // User put Google key in OPENAI_API_KEY

export async function getEmbeddings(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text.replace(/\n/g, " ").slice(0, 8000));
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values) {
      console.warn("Google embedding API warning: No embedding returned");
      return new Array(768).fill(0.001) as number[];
    }
    return embedding.values.slice(0, 768) as number[];
  } catch (error) {
    console.warn("Fallback to mock vector due to embedding API error:", error);
    return new Array(768).fill(0.001) as number[];
  }
}
