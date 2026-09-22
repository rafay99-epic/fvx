import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { seo } from "./seo";

export default defineConfig({
  plugins: [tanstackRouter({ target: "react" }), react(), tailwindcss(), seo()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
