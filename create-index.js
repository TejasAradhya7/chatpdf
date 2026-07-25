const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config({ path: ".env" });

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.includes("PASTE_YOUR_PINECONE_API_KEY_HERE")) {
    console.error("Please add a valid PINECONE_API_KEY to your .env file first.");
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey });
  const indexName = "chatpdf";

  try {
    console.log(`Checking if index '${indexName}' exists...`);
    const { indexes } = await pc.listIndexes();
    const indexExists = indexes.some((index) => index.name === indexName);
    
    if (indexExists) {
      console.log(`Index '${indexName}' already exists.`);
      return;
    }

    console.log(`Creating index '${indexName}' with 768 dimensions...`);
    await pc.createIndex({
      name: indexName,
      dimension: 768,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
    console.log("Index created successfully!");
  } catch (error) {
    console.error("Failed to create index:", error.message);
  }
}

main();
