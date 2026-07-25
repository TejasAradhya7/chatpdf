import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromSupabase } from "./supabase-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(fileKey: string) {
  // 1. obtain the pdf -> downlaod and read from pdf
  console.log("downloading from supabase into file system");
  const file_name = await downloadFromSupabase(fileKey);
  if (!file_name) {
    throw new Error("could not download from storage");
  }
  console.log("loading pdf into memory" + file_name);
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));
  const allDocs = documents.flat();
  const docsToEmbed = allDocs.slice(0, 100);

  // 3. vectorise and embed documents in small batches to respect OpenAI rate limits
  const vectors: PineconeRecord[] = [];
  const batchSize = 10;
  for (let i = 0; i < docsToEmbed.length; i += batchSize) {
    const batch = docsToEmbed.slice(i, i + batchSize);
    const batchVectors = await Promise.all(
      batch.map(async (doc) => {
        try {
          return await embedDocument(doc);
        } catch (e) {
          console.warn("Skipping chunk embedding due to error:", e);
          return null;
        }
      })
    );
    vectors.push(...(batchVectors.filter(Boolean) as PineconeRecord[]));
  }

  // 4. upload to pinecone if any vectors generated
  if (vectors.length > 0) {
    try {
      const client = await getPineconeClient();
      const pineconeIndex = await client.index("chatpdf");
      const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

      console.log(`inserting ${vectors.length} vectors into pinecone`);
      const formattedRecords = vectors.map((v) => ({
        id: v.id,
        values: v.values,
        metadata: v.metadata,
      }));

      try {
        await (namespace.upsert as any)(formattedRecords);
      } catch (upsertErr) {
        await (namespace.upsert as any)({ records: formattedRecords });
      }
    } catch (pineconeErr) {
      console.warn("Pinecone vector upload warning (non-fatal):", pineconeErr);
    }
  }

  return allDocs;
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
