import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 4173,
  },
  optimizeDeps: {
    include: ["react-is", "recharts"],
  },
  build: {
    outDir: "dist",
    commonjsOptions: {
      include: [/react-is/, /node_modules/],
    },
  },
});