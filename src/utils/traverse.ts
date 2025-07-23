import fs from "fs/promises";
import path from "path";

const SKIPPED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".turbo",
  ".vercel",
  ".cache",
  "logs",
  "log",
  ".expo",
  ".idea",
  ".vscode",
  "storybook-static",
  ".firebase",
  "cypress",
  "public",
  "tmp",
  "temp",
]);

const SKIPPED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  ".env",
  ".env.local",
  ".env.production",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "tsconfig.json",
  "next.config.js",
  "vite.config.ts",
  "tsconfig.node.json",
  "tsconfig.app.json",
  "webpack.config.js",
  "eslint.config.js",
  ".gitignore",
  ".eslintrc",
  ".prettierrc",
  ".editorconfig",
  ".npmrc",
]);

const ALLOWED_EXTENSIONS = new Set([
  // Web & JS ecosystem
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".md",

  // Backend & Scripting
  ".py", // Python
  ".php", // PHP
  ".rb", // Ruby
  ".sh", // Shell scripts
  ".bat", // Batch scripts

  // System languages
  ".cpp",
  ".cc",
  ".cxx",
  ".c", // C / C++
  ".h",
  ".hpp", // C/C++ headers
  ".rs", // Rust
  ".go", // Go
  ".java", // Java
  ".kt",
  ".kts", // Kotlin

  // Misc configs
  ".xml",
  ".toml",
  ".yml",
  ".yaml",
  ".ini",
]);

interface TraverseResult {
  files: { filePath: string; content: string }[];
  stats: {
    totalFiles: number;
    skippedFiles: number;
    skippedDirs: number;
  };
}

export async function traverseFiles(dir: string): Promise<TraverseResult> {
  const result: TraverseResult = {
    files: [],
    stats: { totalFiles: 0, skippedFiles: 0, skippedDirs: 0 },
  };

  async function walk(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip unwanted directories
      if (entry.isDirectory()) {
        if (SKIPPED_DIRS.has(entry.name)) {
          console.log(`🚫 Skipping directory: ${entry.name}`);
          result.stats.skippedDirs++;
          continue;
        }
        await walk(fullPath);
      }

      // Skip unwanted files
      if (entry.isFile()) {
        result.stats.totalFiles++;
        if (SKIPPED_FILES.has(entry.name)) {
          console.log(`🧹 Skipping file: ${entry.name}`);
          result.stats.skippedFiles++;
          continue;
        }

        const ext = path.extname(entry.name);
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          console.log(`⛔ Unsupported extension: ${entry.name}`);
          result.stats.skippedFiles++;
          continue;
        }

        const content = await fs.readFile(fullPath, "utf-8");
        result.files.push({ filePath: fullPath, content });
      }
    }
  }

  await walk(dir);

  // Summary log
  console.log(`\n📊 Scan Summary:`);
  console.log(`   ✅ Read files: ${result.files.length}`);
  console.log(`   🚫 Skipped files: ${result.stats.skippedFiles}`);
  console.log(`   📁 Skipped directories: ${result.stats.skippedDirs}`);
  console.log(`   📄 Total files scanned: ${result.stats.totalFiles}\n`);

  return result;
}
