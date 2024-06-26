import { existsSync, promises as fs } from "fs";
import path from "path";
import { Command } from "commander";
import ora from "ora";
import { execa } from "execa";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";
import { getConfig } from "@/utils/get-config";

import { getComponentsData } from "@/utils/api";

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

      const { components: componentsToAdd } = await getComponentsData({
        componentId: components[0],
        alias: config.alias.components,
      });

      for (const component of componentsToAdd) {
        let spinner = ora(`Adding component ${component.name}`).start();

        const componentPath = path.join(
          config.resolvedPaths.components,
          component.subFolder,
          component.tsx.name
        );
        const componentFilePath = path.join(
          componentPath,
          `${component.tsx.name}.tsx`
        );
        const componentCssFilePath = path.join(
          componentPath,
          `${component.css.name}`
        );

        if (existsSync(componentFilePath)) {
          logger.warn(`Component ${component.tsx.name}.tsx already exists.`);
          // Todo: We can ask the user to overwrite the file.
          continue;
        }

        if (existsSync(componentCssFilePath)) {
          logger.warn(`Component ${component.css.name} already exists.`);
          // Todo: We can ask the user to overwrite the file.
          continue;
        }

        await fs.mkdir(componentPath, { recursive: true });
        await fs.writeFile(componentFilePath, component.tsx.fileData);
        await fs.writeFile(componentCssFilePath, component.css.fileData);

        spinner.succeed();

        // install dependencies
        spinner = ora(`Installing dependencies...`).start();
        const filteredDependencies = component.dependencies
          .filter((deps) => deps !== "react" && deps !== "react-dom")
          .map((dep) => `${dep.split("/")[0]}`);
        logger.info(
          `Installing dependencies: ${filteredDependencies.join(", ")}`
        );
        if (filteredDependencies.length === 0) {
          logger.info("No dependencies to install.");
        } else {
          // Todo: support npm and other package managers.
          await execa("yarn", ["add", ...filteredDependencies]);
        }

        spinner.succeed();
      }
    } catch (error) {
      handleError(error);
    }
  });
