# Integrating Atomic Components to your Application

## Initialise Atomic
Run the following command to initialize the project for Atomic:
```
npx atomic init
```

You will be prompted with a series of questions to configure your project:
<br>

1. **Choose a Theme**: Select a theme from the provided options and press Enter. 

2. **Global CSS File**: Specify the path to your global.css file. If you are using a Next.js app, the default path is `@/app/globals.css`. You can also define a custom path based on your requirements.

3. **Configure Import Alias**: Choose the default alias by pressing Enter or customize it. To customize, locate your `tsconfig.json` file and find the alias under the "paths" section. <br/> Example: **@[your_alias]/atomic-ui.**

4. **Save Configuration**: Confirm writing the configuration to atomic.components.json by pressing the letter "y" on your keyboard.


You are now ready to add Atomic components to your project.

## Adding Atomic Components

To start using Atomic components in your application:

1. Locate the desired Atomic Component from the preview list on the Home page of the Atomic website. 

2. Navigate to the specific Component page by clicking on the desired component from the preview list. Within the Component page, locate the "Add Component to Project" section, typically positioned on the right side of the page.

3. This section displays the CLI command to be used, containing the desired component's name. 


```
npx atomic add [componentName]
``` 

4. The command will add all the code and dependencies required to start using the component in the configured directory.  

Once the code is generated and integrated into your application, you can use it like any other React component.
