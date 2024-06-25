import { Command } from "commander";
import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-d, --defaults,", "use default configuration.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      logger.info("Initializing project...", JSON.stringify(opts, null, 2));
    } catch (error) {
      handleError(error);
    }
  });
