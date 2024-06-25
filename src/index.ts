#!/usr/bin/env node
import { Command } from "commander";

import { init } from "@/commands/init";
import { getPackageInfo } from "@/utils/get-package-info";
import { logger } from "@/utils/logger";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const packageInfo = await getPackageInfo();

  const program = new Command()
    .name("atomic")
    .description("Add components and dependencies to your project")
    .version(
      packageInfo.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )
    .action(() => {
      logger.info("Starting Atomic UI");
    });

  program.addCommand(init);

  program.parse(process.argv);
}

main();
