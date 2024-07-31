import fs from "fs";
import path from "path";
import { loadConfig } from "tsconfig-paths";
import { resolveImport } from "@/utils/resolve-import";

export interface Config {
  theme: {
    css: string;
  };
  alias: {
    components: string;
  };
  resolvedPaths: {
    components: string;
    css: string;
  };
}

export const getConfig = async (cwd: string) => {
  const configPath = path.resolve(cwd, "atomic.components.json");
  const configExists = fs.existsSync(configPath);
  if (!configExists) {
    return null;
  }

  const configContent = await fs.promises.readFile(configPath, "utf-8");
  const config: Config = JSON.parse(configContent);

  return await resolveConfigPaths(cwd, config);
};

export const resolveConfigPaths = async (cwd: string, config: Config) => {
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(`Failed to load tsconfig.json`);
  }

  return {
    ...config,
    resolvedPaths: {
      components: (await resolveImport(config.alias.components, tsConfig)) || "",
      css: path.resolve(cwd, config.theme.css),
    },
  };
};
