import { existsSync, promises as fs } from "fs";
import path from "path";
import { Command } from "commander";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";
import { getConfig } from "@/utils/get-config";

import {} from "@/utils/api";

export const add = new Command()
  .name("add")
  .description("add a component to your project")
  .argument("[components...]", "the components to add")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (components, options) => {
    try {
      logger.info("Initializing Atomic UI - Add Components");
      const cwd = path.resolve(options.cwd);

      // Ensure target directory exists.
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      const config = await getConfig(cwd);
      if (!config) {
        logger.warn(
          `Configuration is missing. Please run "init" to create a getatomic.components.json file.`
        );
        process.exit(1);
      }
    } catch (error) {
      handleError(error);
    }
  });
