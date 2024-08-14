import { existsSync, promises as fs } from "fs";
import path from "path";
import { Command } from "commander";
import ora from "ora";

import { handleError } from "@/utils/handle-error";
import { logger } from "@/utils/logger";
import { getConfig } from "@/utils/get-config";

import { Component, getComponentsData } from "@/utils/api";

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
      logger.info(`Adding components ${components.join(", ")}`);
      const cwd = path.resolve(options.cwd);

      // Ensure target directory exists.
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      const config = await getConfig(cwd);
      if (!config) {
        logger.warn(
          `Configuration is missing. Please run the following command to create a atomic.components.json file. \n`
        );
        logger.warn(`\tnpx atomic init \n`);
        process.exit(1);
      }

      // the map will handle duplicate
      let componentsToAdd: Map<string, Component> = new Map();
      for (const componentId of components) {
        try {
          const { components: fetchedComponents } = await getComponentsData({
            componentId,
          });
          for (const component of fetchedComponents) {
            componentsToAdd.set(component.name, component);
          }
        } catch (error: any) {
          logger.error(`Failed to fetch component data for ${componentId}: ${error}`);
          continue;
        }
      }

      const componentsToAddArray = Array.from(componentsToAdd.values());

      for (const component of componentsToAddArray) {
        let spinner = ora(`Adding component ${component.name}`).start();
        const componentPath = path.join(config.resolvedPaths.components);
        const componentFilePath = path.join(componentPath, `${component.name}.tsx`);
        // const componentCssFilePath = path.join(componentPath, `${component.css.name}`);
        // const indexFilePath = path.join(componentPath, "index.ts");

        if (!existsSync(componentPath)) {
          await fs.mkdir(componentPath, { recursive: true });
        }

        if (existsSync(componentFilePath)) {
          logger.warn(`Component ${component.name}.tsx already exists. Rename or delete the existing file first. Skipping...`);
          // Todo: We can ask the user to overwrite the file.
          // continue;
        } else {
          await fs.writeFile(componentFilePath, component.tsx.fileData);
        }

        spinner.succeed();
      }
    } catch (error) {
      handleError(error);
    }
  });
