import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/whatsapp-analyzer/",
  test: {
    environment: "node",
  },
});
