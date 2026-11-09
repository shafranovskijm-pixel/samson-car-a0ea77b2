import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", include: ["src/lib/tz.paydate.test.ts", "src/components/AppointmentDialog.paydate.test.tsx"] },
});