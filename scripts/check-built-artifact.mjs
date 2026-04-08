import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

const requiredMarkers = [
  "liveKitTokenUrl",
  "liveKitTokenUrlSource",
  "[runtime-config][client]",
  "/api/livekit/token",
];

async function main() {
  const indexHtml = await readFile(indexHtmlPath, "utf8");
  const assetMatch = indexHtml.match(/src="\/(assets\/index-[^"]+\.js)"/);

  if (!assetMatch) {
    throw new Error(`Could not find built main bundle path in ${relative(indexHtmlPath)}`);
  }

  const assetPath = path.join(distDir, assetMatch[1]);
  const assetSource = await readFile(assetPath, "utf8");
  const missingMarkers = requiredMarkers.filter((marker) => !assetSource.includes(marker));

  if (missingMarkers.length > 0) {
    throw new Error(
      [
        `Built frontend artifact is missing expected runtime markers in ${relative(assetPath)}.`,
        `Missing: ${missingMarkers.join(", ")}`,
      ].join(" "),
    );
  }

  console.info("[artifact-smoke] ok", {
    asset: relative(assetPath),
    checkedMarkers: requiredMarkers,
  });
}

function relative(targetPath) {
  return path.relative(projectRoot, targetPath) || ".";
}

main().catch((error) => {
  console.error("[artifact-smoke] failed", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
