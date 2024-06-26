import { existsSync, promises as fs } from "fs";
import path from "path";
import { Command } from "commander";
import ora from "ora";
import { execa } from "execa";

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
          `Configuration is missing. Please run "init" to create a getatomic.components.json file.`
        );
        process.exit(1);
      }

      // the map will handle duplicate
      let componentsToAdd: Map<string, Component> = new Map();
      let dependenciesToInstall: Set<string> = new Set();
      for (const componentId of components) {
        try {
          const { components: fetchedComponents } = await getComponentsData({
            componentId,
            alias: config.alias.components,
          });
          for (const component of fetchedComponents) {
            componentsToAdd.set(component.name, component);
            for (const dep of component.dependencies) {
              dependenciesToInstall.add(dep);
            }
          }
        } catch (error: any) {
          logger.error(`Failed to fetch component data for ${componentId}: ${error}`);
          continue;
        }
      }

      const componentsToAddArray = Array.from(componentsToAdd.values());
      const dependenciesToInstallArray = Array.from(dependenciesToInstall);

      // install dependencies
      let spinner = ora(`Installing dependencies...`).start();
      const filteredDependencies = dependenciesToInstallArray
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

      for (const component of componentsToAddArray) {
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
        const indexFilePath = path.join(componentPath, "index.ts");

        if (!existsSync(componentPath)) {
          await fs.mkdir(componentPath, { recursive: true });
        }

        if (existsSync(componentFilePath)) {
          logger.warn(`Component ${component.tsx.name}.tsx already exists. Skipping.`);
          // Todo: We can ask the user to overwrite the file.
          // continue;
        } else {
          await fs.writeFile(componentFilePath, component.tsx.fileData);
        }

        if (existsSync(componentCssFilePath)) {
          logger.warn(`Component ${component.css.name} already exists. Skipping.`);
          // Todo: We can ask the user to overwrite the file.
          // continue;
        } else {
          await fs.writeFile(componentCssFilePath, component.css.fileData);
        }

        if (existsSync(indexFilePath)) {
          logger.warn(`Component index.ts already exists. Skipping.`);
        } else {
          const exportStatements: string[] = component.exports.map((exp) => {
            if (exp.type === "TSInterfaceDeclaration" || exp.type === "TSTypeAliasDeclaration") {
              return `export type { ${exp.name} as ${exp.name} } from "./${component.tsx.name}";`
            } else {
              return `export { ${exp.name} as ${exp.name} } from "./${component.tsx.name}";`
            }
          });
          await fs.writeFile(
            indexFilePath,
            exportStatements.join("\n"),
          );
        }

        // addint to block/index.ts.
        const block = component.name.split("/")[0]
        if (block !== component.subFolder) {
          logger.warn(`Block ${block} is not the same as the subfolder ${component.subFolder}.`);
        }
        const blockIndexPath = path.join(
          config.resolvedPaths.components,
          component.subFolder,
          "index.ts"
        );
        const blockIndexContent = `export * from "./${component.tsx.name}";\n`;
        if (existsSync(blockIndexPath)) {
          const blockIndexData = await fs.readFile(blockIndexPath, "utf8");
          if (!blockIndexData.includes(blockIndexContent)) {
            await fs.appendFile(blockIndexPath, blockIndexContent);
          }
        } else {
          await fs.writeFile(blockIndexPath, blockIndexContent);
        }

        spinner.succeed();
      }
    } catch (error) {
      handleError(error);
    }
  });
