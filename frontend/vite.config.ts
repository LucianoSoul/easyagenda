import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production") {
    const missingVariables = ["VITE_API_URL", "VITE_PUBLIC_APP_BASE_URL"].filter(
      (key) => !env[key]?.trim()
    );

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingVariables.join(", ")}`
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173
    }
  };
});
