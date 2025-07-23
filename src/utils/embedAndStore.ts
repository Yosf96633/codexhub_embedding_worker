// embedAndStore.ts
import { QdrantClient } from "@qdrant/qdrant-js";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

const COLLECTION_NAME = "codebase";

export async function ensureCollection() {
  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
    console.log(`✅ Created collection: ${COLLECTION_NAME}`);
  }
}

export async function embedAndStoreChunks(chunks: any[]) {
  await ensureCollection();

  for (const chunk of chunks) {
    try {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.chunk,
        encoding_format: "float",
      });

      const vector = res.data[0].embedding;

      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [
          {
            id: uuidv4(),
            vector,
            payload: {
              user_id: chunk.user_id,
              file_path: chunk.file_path,
              language: chunk.language,
              chunk_index: chunk.chunk_index,
              start_line: chunk.start_line,
              end_line: chunk.end_line,
              preview: chunk.chunk.slice(0, 300), // Optional: small preview
            },
          },
        ],
      });

      console.log(`✅ Embedded & stored: ${chunk.file_path} [${chunk.chunk_index}]`);
    } catch (err) {
      console.error(`❌ Failed to embed: ${chunk.file_path}`, err);
    }
  }

  console.log("🎉 All chunks embedded & stored in Qdrant.");
}
