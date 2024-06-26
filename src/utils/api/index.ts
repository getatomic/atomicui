export const baseUrl = "http://localhost:3000/api/";

interface Theme {
  id: string;
  name: string;
}

export const getThemes = async (): Promise<Theme[]> => {
  try {
    const response = await fetch(`${baseUrl}/themes/list`);
    return (await response.json()) as Theme[];
  } catch (error) {
    throw new Error(`Failed to fetch themes.`);
  }
};

interface InitData {
  css: string;
  dependencies: string[];
}

export const getInitData = async ({
  theme,
}: {
  theme: string;
}): Promise<InitData> => {
  try {
    const response = await fetch(`${baseUrl}/user-setup/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: theme }),
    });
    return (await response.json()) as InitData;
  } catch (error) {
    throw new Error(`Failed to fetch init data.`);
  }
};

interface Component {
  name: string;
  dependentComponents: string[];
  dependencies: string[];
  devDependencies: string[];
  subFolder: string;
  tsx: {
    name: string;
    fileData: string;
  };
  css: {
    name: string;
    fileData: string;
  };
}

interface GetComponentsDataResponse {
  components: Component[];
}

export const getComponentsData = async ({
  componentId,
  alias,
}: {
  componentId: string;
  alias: string;
}): Promise<GetComponentsDataResponse> => {
  try {
    const response = await fetch(`${baseUrl}/user-setup/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: componentId, alias }),
    });
    return (await response.json()) as GetComponentsDataResponse;
  } catch (error) {
    throw new Error(`Failed to fetch init data.`);
  }
};
