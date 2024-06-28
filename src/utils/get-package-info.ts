import path from "path";
import fs from "fs-extra";
import { type PackageJson } from "type-fest";
import { detect } from "@antfu/ni";

export const getPackageInfo = () => {
  const packageJsonPath = path.join("package.json");

  return fs.readJSONSync(packageJsonPath) as PackageJson;
};

export const checkPackageExists = (
  packageName: string,
  cwd: string
): boolean => {
  try {
    const packageJsonPath = path.resolve(cwd, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return !!Object.keys(packageJson.dependencies || {}).includes(packageName);
  } catch (error) {
    console.error(`Error reading package.json: ${error}`);
    return false;
  }
};

export const getPackageManager = async (
  targetDir: string
): Promise<"yarn" | "pnpm" | "bun" | "npm"> => {
  const packageManager = await detect({ programmatic: true, cwd: targetDir });

  if (packageManager === "yarn@berry") return "yarn";
  if (packageManager === "pnpm@6") return "pnpm";
  if (packageManager === "bun") return "bun";

  return packageManager ?? "npm";
};
