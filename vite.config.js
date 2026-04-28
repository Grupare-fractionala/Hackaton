import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

function resolveBasePath() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    const normalized = explicitBase.startsWith("/") ? explicitBase : `/${explicitBase}`;
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }

  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const repository = process.env.GITHUB_REPOSITORY || "";
  const repositoryName = repository.split("/")[1];

  if (isGitHubActions && repositoryName) {
    return `/${repositoryName}/`;
  }

  return "/";
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/flowise": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flowise/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
