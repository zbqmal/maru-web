import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CONTRACT_SOURCE_REPO =
  process.env.API_CONTRACT_SOURCE_REPO ?? "zbqmal/maru-api";
export const CONTRACT_SOURCE_REF = process.env.API_CONTRACT_SOURCE_REF ?? "dev";
export const CONTRACT_DIRECTORY = "docs/api-contracts";
export const CONTRACT_FILE_NAMES = ["openapi.json"];

export function buildRawGitHubUrl(relativePath, ref = CONTRACT_SOURCE_REF) {
  return `https://raw.githubusercontent.com/${CONTRACT_SOURCE_REPO}/${ref}/${relativePath}`;
}

export function getContractSyncTargets(rootDir = process.cwd()) {
  return CONTRACT_FILE_NAMES.map((fileName) => {
    const relativePath = `${CONTRACT_DIRECTORY}/${fileName}`;

    return {
      fileName,
      relativePath,
      sourceUrl: buildRawGitHubUrl(relativePath),
      destinationPath: path.join(rootDir, CONTRACT_DIRECTORY, fileName),
    };
  });
}

export async function syncApiContracts() {
  const targets = getContractSyncTargets();

  await fs.mkdir(path.join(process.cwd(), CONTRACT_DIRECTORY), { recursive: true });

  for (const target of targets) {
    const response = await fetch(target.sourceUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${target.sourceUrl}: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    await fs.writeFile(target.destinationPath, content, "utf8");
    console.log(`Synced ${target.relativePath}`);
  }
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  syncApiContracts().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
