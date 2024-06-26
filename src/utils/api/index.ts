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
