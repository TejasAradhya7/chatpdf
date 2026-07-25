import { getPineconeClient } from "./pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  try {
    const client = getPineconeClient();
    const pineconeIndex = await client.index("chatpdf");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    const queryResult = await namespace.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}

export async function getContext(query: string, fileKey: string) {
  try {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    const qualifyingDocs = matches.filter(
      (match) => match.score && match.score > 0.3
    );

    const docsToUse = qualifyingDocs.length > 0 ? qualifyingDocs : matches.slice(0, 5);

    type Metadata = {
      text: string;
      pageNumber: number;
    };

    let docs = docsToUse.map(
      (match) => `[Page ${(match.metadata as Metadata)?.pageNumber || 1}]: ${(match.metadata as Metadata)?.text || ''}`
    );
    return docs.join("\n").substring(0, 4000);
  } catch (err) {
    console.warn("Context retrieval fallback:", err);
    return "";
  }
}

