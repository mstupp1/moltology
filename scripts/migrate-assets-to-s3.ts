import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { uploadObject, getPresignedViewUrl, ensureBucketExists, DEFAULT_BUCKET } from "../src/lib/s3-client";

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public", "images");

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function getAllFiles(dirPath: string, relativePrefix: string = ""): Promise<{ fullPath: string; key: string }[]> {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let files: { fullPath: string; key: string }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, relativePath);
      files = files.concat(subFiles);
    } else if (entry.isFile()) {
      files.push({ fullPath, key: `images/${relativePath}` });
    }
  }

  return files;
}

async function runMigration() {
  console.log("=== Moltology Neon S3 Asset Migration ===");
  console.log(`Target Bucket: ${DEFAULT_BUCKET}`);
  console.log(`Source Directory: ${PUBLIC_IMAGES_DIR}\n`);

  if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    console.error(`Error: Source directory ${PUBLIC_IMAGES_DIR} does not exist.`);
    process.exit(1);
  }

  await ensureBucketExists(DEFAULT_BUCKET);

  const files = await getAllFiles(PUBLIC_IMAGES_DIR);
  console.log(`Found ${files.length} images to migrate...\n`);

  const results: { key: string; status: string; url?: string; size: number }[] = [];

  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.fullPath);
    const contentType = getMimeType(file.fullPath);

    console.log(`Uploading [${file.key}] (${fileBuffer.length} bytes, ${contentType})...`);

    try {
      await uploadObject({
        key: file.key,
        body: fileBuffer,
        contentType,
      });

      const presignedUrl = await getPresignedViewUrl(file.key);
      console.log(`  ✓ Uploaded successfully!`);
      console.log(`  🔗 Presigned URL: ${presignedUrl}\n`);

      results.push({
        key: file.key,
        status: "SUCCESS",
        url: presignedUrl,
        size: fileBuffer.length,
      });
    } catch (err: any) {
      console.error(`  ❌ Failed to upload ${file.key}:`, err.message);
      results.push({
        key: file.key,
        status: `FAILED: ${err.message}`,
        size: fileBuffer.length,
      });
    }
  }

  console.log("=== Migration Summary ===");
  const successCount = results.filter((r) => r.status === "SUCCESS").length;
  console.log(`Total Uploaded: ${successCount} / ${files.length} files`);
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
