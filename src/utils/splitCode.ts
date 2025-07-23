export function splitCodeSmart(
  code: string,
  maxTokens = 800
): { chunk: string; startLine: number; endLine: number }[] {
  const lines = code.split("\n");
  const chunks = [];
  let currentChunk = "";
  let tokenCount = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const estimatedTokens = Math.ceil(line.length / 4);

    if (tokenCount + estimatedTokens > maxTokens) {
      chunks.push({
        chunk: currentChunk,
        startLine,
        endLine: i - 1,
      });
      currentChunk = "";
      tokenCount = 0;
      startLine = i;
    }

    currentChunk += line + "\n";
    tokenCount += estimatedTokens;
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunk: currentChunk,
      startLine,
      endLine: lines.length - 1,
    });
  }

  return chunks;
}
