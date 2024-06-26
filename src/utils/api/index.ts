let baseUrl: string;
if (process.env.NODE_ENV === "development") {
  baseUrl = "http://localhost:3000/api/";
} else {
  baseUrl = "https://app.getatomic.ai/api/";
}

interface Theme {
  id: string;
  name: string;
}

export const getThemes = async (): Promise<Theme[]> => {
  try {
    const response = await fetch(`${baseUrl}/themes/list`);
    return (await response.json()) as Theme[];
  } catch (error) {
    throw new Error(`Failed to fetch themes. ${error}`);
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
    const response = await fetch(`${baseUrl}/codebase-integration/init`, {
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

export interface Component {
  name: string;
  dependentComponents: string[];
  dependencies: string[];
  subFolder: string;
  tsx: {
    name: string;
    fileData: string;
  };
  css: {
    name: string;
    fileData: string;
  };
  exports: { name: string; type: string }[]
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
    const response = await fetch(`${baseUrl}/codebase-integration/add`, {
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
