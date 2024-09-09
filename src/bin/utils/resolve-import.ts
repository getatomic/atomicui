import {
  createMatchPath,
  type ConfigLoaderSuccessResult,
} from "tsconfig-paths";

export const resolveImport = async (
  importPath: string,
  config: Pick<ConfigLoaderSuccessResult, "absoluteBaseUrl" | "paths">
) => {
  return createMatchPath(
    config.absoluteBaseUrl,
    config.paths,
    undefined,
    false
  )(importPath, undefined, () => true, [".ts", ".tsx"]);
};
