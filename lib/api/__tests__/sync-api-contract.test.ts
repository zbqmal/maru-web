import path from "node:path";

let buildRawGitHubUrl: (relativePath: string, ref?: string) => string;
let getContractSyncTargets: (
  rootDir?: string,
) => Array<{
  fileName: string;
  relativePath: string;
  sourceUrl: string;
  destinationPath: string;
}>;

describe("sync-api-contract script", () => {
  beforeAll(async () => {
    ({ buildRawGitHubUrl, getContractSyncTargets } = await import("../../../scripts/sync-api-contract.mjs"));
  });

  it("builds raw GitHub URLs from the maru-api dev branch", () => {
    expect(buildRawGitHubUrl("docs/api-contracts/openapi.json")).toBe(
      "https://raw.githubusercontent.com/zbqmal/maru-api/dev/docs/api-contracts/openapi.json",
    );
  });

  it("targets the checked-in docs/api-contracts files in this repo", () => {
    expect(getContractSyncTargets("/repo")).toEqual([
      {
        fileName: "openapi.json",
        relativePath: "docs/api-contracts/openapi.json",
        sourceUrl: "https://raw.githubusercontent.com/zbqmal/maru-api/dev/docs/api-contracts/openapi.json",
        destinationPath: path.join("/repo", "docs", "api-contracts", "openapi.json"),
      },
    ]);
  });
});
