export const baseUrl = "https://atomic-toy.azurewebsites.net/api/registry/";

interface Theme {
  name: string;
}

export const getThemes = async (): Promise<Theme[]> => {
  try {
    return new Promise<Theme[]>((resolve) => {
      setTimeout(() => {
        resolve([{ name: "theme1" }, { name: "theme2" }, { name: "theme3" }]);
      }, 1000);
    });
    // const response = await fetch(`${baseUrl}/themes`);
    // return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch themes.`);
  }
};
