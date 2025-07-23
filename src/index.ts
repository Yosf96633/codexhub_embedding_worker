import { traverseFiles } from "./utils/traverse";
import { splitCodeSmart } from "./utils/splitCode";
import path from "path";
import { embedAndStoreChunks } from "./utils/embedAndStore";

export const fun = async (repoPath: string, userId = "user_123") => {
  const { files } = await traverseFiles(repoPath);
  const allChunks = [];

  for (const { filePath, content } of files) {
    const chunks = splitCodeSmart(content, 800); // 800 token-sized chunks

    const metadataChunks = chunks.map((chunk, index) => ({
      user_id: userId,
      file_path: filePath,
      language: path.extname(filePath).slice(1),
      chunk_index: index,
      start_line: chunk.startLine,
      end_line: chunk.endLine,
      chunk: chunk.chunk,
    }));

    allChunks.push(...metadataChunks);
  }

  console.log("📦 Final enriched chunks:", allChunks);
  await embedAndStoreChunks(allChunks)
};
