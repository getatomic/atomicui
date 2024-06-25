import { existsSync, promises as fs } from "fs";
import path from "path";
import prompts from "prompts";
import ora from "ora";
import { Command } from "commander";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";

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

  const spinner = ora(`Writing components.json...`).start();
  const targetPath = path.resolve(cwd, "atomic.components.json");
  await fs.writeFile(
    targetPath,
    JSON.stringify(atomicComponentsConfig, null, 2),
    "utf8"
  );
  spinner.succeed();
}
