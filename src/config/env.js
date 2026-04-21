export const isMockMode =
  import.meta.env.MODE !== "test" && import.meta.env.VITE_USE_MOCK === "true";
