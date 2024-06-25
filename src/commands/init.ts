import { existsSync, promises as fs } from "fs";
import path from "path";
import prompts from "prompts";
import ora from "ora";
import { loadConfig } from "tsconfig-paths";
import { Command } from "commander";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";
import { resolveImport } from "@/utils/resolve-import";

import { getThemes } from "@/utils/api";

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (options) => {
    try {
      logger.info("Initializing Atomic UI");
      const cwd = path.resolve(options.cwd);

      // Ensure target directory exists.
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      // Check for an existing atomic.components.js file at cwd

      const projectConfig = await promptForProjectDetails(cwd);
      logger.info(
        "Project configuration saved to atomic.components.json",
        JSON.stringify(projectConfig)
      );
    } catch (error) {
      handleError(error);
    }
  });

async function promptForProjectDetails(cwd: string) {
  const themes = await getThemes();
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(`Failed to load tsconfig.json`);
  }

  const options = await prompts([
    {
      type: "select",
      name: "theme",
      message: `Which theme would you like to use?`,
      choices: themes.map((theme) => ({
        title: theme.name,
        value: theme.name,
      })),
    },
    {
      type: "text",
      name: "globalCSS",
      message: `Where is your global CSS file?`,
      initial: "app/globals.css",
    },
    {
      type: "text",
      name: "components",
      message: `Configure the import alias for the atomic components.`,
      initial: "@/atomic-ui-components",
    },
  ]);

  const atomicComponentsConfig = {
    theme: {
      name: options.theme,
      css: options.globalCSS,
    },
    alias: {
      components: options.components,
    },
  };

  const { proceed } = await prompts({
    type: "confirm",
    name: "proceed",
    message: `Write configuration to "atomic.components.json". Proceed?`,
    initial: true,
  });

  if (!proceed) {
    process.exit(0);
  }

  const spinner = ora(`Writing atomic.components.json...`).start();
  const targetPath = path.resolve(cwd, "atomic.components.json");
  await fs.writeFile(
    targetPath,
    JSON.stringify(atomicComponentsConfig, null, 2),
    "utf8"
  );
  spinner.succeed();

  return {
    ...atomicComponentsConfig,
    resolvedPaths: {
      components: await resolveImport(options.components, tsConfig),
    },
  };
}

export async function runInit(cwd: string, config: Config) {
  const spinner = ora(`Initializing project...`)?.start();

  // Ensure all resolved paths directories exist.
  for (const [key, resolvedPath] of Object.entries(config.resolvedPaths)) {
    // Determine if the path is a file or directory.
    // TODO: is there a better way to do this?
    let dirname = path.extname(resolvedPath)
      ? path.dirname(resolvedPath)
      : resolvedPath;

    // If the utils alias is set to something like "@/lib/utils",
    // assume this is a file and remove the "utils" file name.
    // TODO: In future releases we should add support for individual utils.
    if (key === "utils" && resolvedPath.endsWith("/utils")) {
      // Remove /utils at the end.
      dirname = dirname.replace(/\/utils$/, "");
    }

    if (!existsSync(dirname)) {
      await fs.mkdir(dirname, { recursive: true });
    }
  }

  const extension = config.tsx ? "ts" : "js";

  const tailwindConfigExtension = path.extname(
    config.resolvedPaths.tailwindConfig
  );

  let tailwindConfigTemplate: string;
  if (tailwindConfigExtension === ".ts") {
    tailwindConfigTemplate = config.tailwind.cssVariables
      ? templates.TAILWIND_CONFIG_TS_WITH_VARIABLES
      : templates.TAILWIND_CONFIG_TS;
  } else {
    tailwindConfigTemplate = config.tailwind.cssVariables
      ? templates.TAILWIND_CONFIG_WITH_VARIABLES
      : templates.TAILWIND_CONFIG;
  }

  // Write tailwind config.
  await fs.writeFile(
    config.resolvedPaths.tailwindConfig,
    template(tailwindConfigTemplate)({
      extension,
      prefix: config.tailwind.prefix,
    }),
    "utf8"
  );

  // Write css file.
  const baseColor = await getRegistryBaseColor(config.tailwind.baseColor);
  if (baseColor) {
    await fs.writeFile(
      config.resolvedPaths.tailwindCss,
      config.tailwind.cssVariables
        ? config.tailwind.prefix
          ? applyPrefixesCss(baseColor.cssVarsTemplate, config.tailwind.prefix)
          : baseColor.cssVarsTemplate
        : baseColor.inlineColorsTemplate,
      "utf8"
    );
  }

  // Write cn file.
  await fs.writeFile(
    `${config.resolvedPaths.utils}.${extension}`,
    extension === "ts" ? templates.UTILS : templates.UTILS_JS,
    "utf8"
  );

  spinner?.succeed();

  // Install dependencies.
  const dependenciesSpinner = ora(`Installing dependencies...`)?.start();
  const packageManager = await getPackageManager(cwd);

  // TODO: add support for other icon libraries.
  const deps = [
    ...PROJECT_DEPENDENCIES,
    config.style === "new-york" ? "@radix-ui/react-icons" : "lucide-react",
  ];

  await execa(
    packageManager,
    [packageManager === "npm" ? "install" : "add", ...deps],
    {
      cwd,
    }
  );
  dependenciesSpinner?.succeed();
}
