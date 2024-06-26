import { existsSync, promises as fs } from "fs";
import path, { resolve } from "path";
import prompts from "prompts";
import ora from "ora";
import { execa } from "execa";
import { Command } from "commander";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";
import { resolveConfigPaths, Config } from "@/utils/get-config";

import { getThemes, getInitData } from "@/utils/api";

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

      const projectConfig = await promptForProjectDetails(cwd);
      logger.info(
        "Project configuration saved to getatomic.components.json",
        JSON.stringify(projectConfig)
      );

      await runInit(cwd, projectConfig);
    } catch (error) {
      handleError(error);
    }
  });

async function promptForProjectDetails(cwd: string) {
  const themes = await getThemes();

  const options = await prompts([
    {
      type: "select",
      name: "theme",
      message: `Which theme would you like to use?`,
      choices: themes.map((theme) => ({
        title: theme.name,
        value: theme.id,
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
      initial: "@/components/getatomic",
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
    message: `Write configuration to "getatomic.components.json". Proceed?`,
    initial: true,
  });

  if (!proceed) {
    process.exit(0);
  }

  const spinner = ora(`Writing getatomic.components.json...`).start();
  const targetPath = path.resolve(cwd, "getatomic.components.json");
  await fs.writeFile(
    targetPath,
    JSON.stringify(atomicComponentsConfig, null, 2),
    "utf8"
  );
  spinner.succeed();

  return resolveConfigPaths(cwd, atomicComponentsConfig as Config);
}

export async function runInit(cwd: string, config: Config) {
  const spinner = ora(`Initializing project...`).start();

  if (!existsSync(config.resolvedPaths.components)) {
    await fs.mkdir(config.resolvedPaths.components, { recursive: true });
  }

  const initData = await getInitData({
    theme: config.theme.name,
  });

  // Write global CSS file.
  await fs.writeFile(config.resolvedPaths.css, initData.css, "utf8");

  spinner.succeed();

  // Install dependencies.
  const dependenciesSpinner = ora(`Installing dependencies...`).start();

  if (initData.dependencies.length === 0) {
    logger.info("No dependencies to install.");
  } else {
    // Todo: support npm and other package managers.
    await execa("yarn", ["add", ...initData.dependencies]);
  }

  dependenciesSpinner.succeed();
}
